import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PointsTransaction } from '../../database/entities/points-transaction.entity';
import { User } from '../../database/entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { RedeemDto } from './dto/redeem.dto';
import { REWARD_LIST } from './rewards/reward-list';

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointsTransaction)
    private readonly pointsTxRepo: Repository<PointsTransaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  /** 查询积分余额 */
  async getBalance(userId: string): Promise<{ balance: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return { balance: user.pointsBalance };
  }

  /** 查询积分明细 */
  async getTransactions(
    userId: string,
    query: QueryTransactionsDto,
  ): Promise<PaginatedResult<PointsTransaction>> {
    const { type, source, page = 1, pageSize = 20 } = query;

    const qb = this.pointsTxRepo
      .createQueryBuilder('tx')
      .where('tx.user_id = :userId', { userId });

    if (type) {
      qb.andWhere('tx.type = :type', { type });
    }
    if (source) {
      qb.andWhere('tx.source = :source', { source });
    }

    qb.orderBy('tx.created_at', 'DESC');

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 赚取积分
   * 必须在事务内完成：SELECT ... FOR UPDATE → 更新 points_balance → 插入 points_transactions
   * 幂等：idempotency_key 唯一索引防重复
   */
  async earnPoints(
    userId: string,
    amount: number,
    source: string,
    sourceId: string | null,
    idempotencyKey: string,
    description: string,
  ): Promise<PointsTransaction> {
    return this.dataSource.transaction(async (manager) => {
      // 幂等检查
      const existing = await manager.findOne(PointsTransaction, {
        where: { idempotencyKey },
      });
      if (existing) return existing;

      // 行锁读取用户余额
      const user = await manager
        .createQueryBuilder(User, 'u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: userId })
        .getOne();

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 更新余额
      const newBalance = BigInt(user.pointsBalance) + BigInt(amount);
      user.pointsBalance = newBalance.toString();
      await manager.save(user);

      // 插入流水
      const tx = manager.create(PointsTransaction, {
        userId,
        type: 'earn',
        amount: String(amount),
        source,
        sourceId,
        description,
        idempotencyKey,
      });
      return manager.save(tx);
    });
  }

  /**
   * 消费积分
   * 事务 + 行锁 + Redis 分布式锁（ADR-006）
   * 余额不足拒绝，points_balance 不允许负值
   */
  async spendPoints(
    userId: string,
    amount: number,
    source: string,
    idempotencyKey: string,
    description: string,
  ): Promise<PointsTransaction> {
    // Redis 分布式锁
    const lockKey = `points:lock:${userId}`;
    const lockAcquired = await this.redisService.getClient().set(
      lockKey,
      '1',
      'EX',
      10,
      'NX',
    );

    if (!lockAcquired) {
      throw new BadRequestException('操作过于频繁，请稍后再试');
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        // 幂等检查
        const existing = await manager.findOne(PointsTransaction, {
          where: { idempotencyKey },
        });
        if (existing) return existing;

        // 行锁读取用户余额
        const user = await manager
          .createQueryBuilder(User, 'u')
          .setLock('pessimistic_write')
          .where('u.id = :id', { id: userId })
          .getOne();

        if (!user) {
          throw new NotFoundException('用户不存在');
        }

        const currentBalance = BigInt(user.pointsBalance);
        if (currentBalance < BigInt(amount)) {
          throw new BadRequestException('积分余额不足');
        }

        // 更新余额（不允许负值）
        const newBalance = currentBalance - BigInt(amount);
        user.pointsBalance = newBalance.toString();
        await manager.save(user);

        // 插入流水
        const tx = manager.create(PointsTransaction, {
          userId,
          type: 'spend',
          amount: String(amount),
          source,
          sourceId: null,
          description,
          idempotencyKey,
        });
        return manager.save(tx);
      });
    } finally {
      // 释放锁
      await this.redisService.del(lockKey);
    }
  }

  /** 兑换奖励 */
  async redeem(userId: string, dto: RedeemDto): Promise<PointsTransaction> {
    const reward = REWARD_LIST.find((r) => r.id === dto.rewardId);
    if (!reward) {
      throw new NotFoundException('奖励不存在');
    }
    if (!reward.available) {
      throw new BadRequestException('该奖励暂不可兑换');
    }

    // 扣减积分 + 发放奖励（通过 spendPoints 完成）
    return this.spendPoints(
      userId,
      reward.cost,
      `redeem:${reward.type}`,
      dto.idempotencyKey,
      `兑换: ${reward.name}`,
    );
  }

  /** 获取可兑换奖励列表 */
  async getRewards() {
    return REWARD_LIST;
  }
}
