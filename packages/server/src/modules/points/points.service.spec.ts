import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PointsService } from './points.service';
import { PointsTransaction } from '../../database/entities/points-transaction.entity';
import { User } from '../../database/entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { DataSource } from 'typeorm';

describe('PointsService', () => {
  let service: PointsService;
  let pointsTxRepo: any;
  let userRepo: any;
  let dataSource: any;
  let redisService: any;

  // Mock 用户数据
  const mockUser = {
    id: '1',
    nickname: '测试用户',
    pointsBalance: '100',
    role: 'user',
    status: 'active',
  };

  // Mock 事务管理器
  const createMockManager = (overrides: Record<string, any> = {}) => ({
    findOne: jest.fn().mockResolvedValue(null),
    createQueryBuilder: jest.fn().mockReturnValue({
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(mockUser),
    }),
    save: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockReturnValue({}),
    ...overrides,
  });

  beforeEach(async () => {
    pointsTxRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }),
    };

    userRepo = {
      findOne: jest.fn(),
    };

    // Mock DataSource 事务
    dataSource = {
      transaction: jest.fn((cb) => cb(createMockManager())),
    };

    // Mock RedisService
    redisService = {
      getClient: jest.fn().mockReturnValue({
        set: jest.fn().mockResolvedValue('OK'),
      }),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsService,
        { provide: getRepositoryToken(PointsTransaction), useValue: pointsTxRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<PointsService>(PointsService);

    jest.clearAllMocks();
  });

  describe('earnPoints', () => {
    // 积分赚取成功
    it('积分赚取成功', async () => {
      const mockManager = createMockManager();
      // 幂等检查：不存在
      mockManager.findOne.mockResolvedValue(null);
      // 行锁读取用户
      mockManager.createQueryBuilder().getOne.mockResolvedValue({
        ...mockUser,
        pointsBalance: '100',
      });
      mockManager.save.mockImplementation((entity: any) => entity);
      mockManager.create.mockReturnValue({ id: 'tx1' });

      dataSource.transaction.mockImplementation((cb: any) => cb(mockManager));

      const result = await service.earnPoints(
        '1',
        50,
        'post_create',
        'post1',
        'post_create:post1:1',
        '发帖奖励',
      );

      // 验证事务被调用
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    // 幂等键重复时返回已有记录
    it('幂等键重复时返回已有记录', async () => {
      const existingTx = { id: 'tx1', idempotencyKey: 'post_create:post1:1' };
      const mockManager = createMockManager();
      // 幂等检查：已存在
      mockManager.findOne.mockResolvedValue(existingTx);

      dataSource.transaction.mockImplementation((cb: any) => cb(mockManager));

      const result = await service.earnPoints(
        '1',
        50,
        'post_create',
        'post1',
        'post_create:post1:1',
        '发帖奖励',
      );

      expect(result).toBe(existingTx);
      // 不应执行 save（幂等直接返回）
      expect(mockManager.save).toHaveBeenCalledTimes(0);
    });
  });

  describe('spendPoints', () => {
    // 余额不足拒绝
    it('余额不足时应抛出 BadRequestException', async () => {
      // Redis 锁获取成功
      redisService.getClient().set.mockResolvedValue('OK');

      const mockManager = createMockManager();
      // 幂等检查：不存在
      mockManager.findOne.mockResolvedValue(null);
      // 行锁读取用户：余额不足
      mockManager.createQueryBuilder().getOne.mockResolvedValue({
        ...mockUser,
        pointsBalance: '10', // 余额只有 10
      });

      dataSource.transaction.mockImplementation((cb: any) => cb(mockManager));

      await expect(
        service.spendPoints('1', 100, 'redeem', 'redeem:key1', '兑换奖励'),
      ).rejects.toThrow(BadRequestException);

      // 验证 Redis 锁被释放
      expect(redisService.del).toHaveBeenCalledWith('points:lock:1');
    });

    // 幂等键防重复
    it('幂等键重复时返回已有记录', async () => {
      // Redis 锁获取成功
      redisService.getClient().set.mockResolvedValue('OK');

      const existingTx = { id: 'tx1', idempotencyKey: 'redeem:key1' };
      const mockManager = createMockManager();
      // 幂等检查：已存在
      mockManager.findOne.mockResolvedValue(existingTx);

      dataSource.transaction.mockImplementation((cb: any) => cb(mockManager));

      const result = await service.spendPoints(
        '1',
        50,
        'redeem',
        'redeem:key1',
        '兑换奖励',
      );

      expect(result).toBe(existingTx);
      // 验证 Redis 锁被释放
      expect(redisService.del).toHaveBeenCalledWith('points:lock:1');
    });

    // Redis 锁获取失败
    it('Redis 锁获取失败时应抛出 BadRequestException', async () => {
      // Redis 锁获取失败
      redisService.getClient().set.mockResolvedValue(null);

      await expect(
        service.spendPoints('1', 50, 'redeem', 'redeem:key1', '兑换奖励'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.spendPoints('1', 50, 'redeem', 'redeem:key1', '兑换奖励'),
      ).rejects.toThrow('操作过于频繁');
    });
  });
});
