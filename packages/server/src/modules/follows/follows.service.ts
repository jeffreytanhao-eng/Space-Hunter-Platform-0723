import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../../database/entities/follow.entity';
import { User } from '../../database/entities/user.entity';

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** 关注用户 */
  async follow(followerId: string, followingId: string): Promise<Follow> {
    // 不能关注自己
    if (followerId === followingId) {
      throw new BadRequestException('不能关注自己');
    }

    // 检查被关注用户是否存在
    const targetUser = await this.userRepo.findOne({ where: { id: followingId } });
    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }

    // 不能重复关注（唯一约束兜底）
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    if (existing) {
      throw new BadRequestException('已关注该用户');
    }

    const follow = this.followRepo.create({
      followerId,
      followingId,
    });
    return this.followRepo.save(follow);
  }

  /** 取消关注 */
  async unfollow(followerId: string, followingId: string): Promise<void> {
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    if (!existing) {
      throw new BadRequestException('未关注该用户');
    }
    await this.followRepo.remove(existing);
  }

  /** 粉丝列表 */
  async getFollowers(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResult<Follow>> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.followRepo.findAndCount({
      where: { followingId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** 关注列表 */
  async getFollowing(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResult<Follow>> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.followRepo.findAndCount({
      where: { followerId: userId },
      relations: ['following'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** 查询关注状态 */
  async isFollowing(followerId: string, followingId: string): Promise<{ following: boolean }> {
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    return { following: !!existing };
  }
}
