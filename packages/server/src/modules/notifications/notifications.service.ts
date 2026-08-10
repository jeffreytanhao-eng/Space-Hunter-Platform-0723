import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateNotificationInput {
  userId: string;
  type: string;
  actorId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  content: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  /** 创建通知（供各业务模块挂载调用） */
  async create(input: CreateNotificationInput): Promise<Notification | null> {
    // 不给自己发通知
    if (input.actorId && input.actorId === input.userId) {
      return null;
    }
    const notification = this.notificationRepo.create({
      userId: input.userId,
      type: input.type,
      actorId: input.actorId ?? null,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      content: input.content,
    });
    return this.notificationRepo.save(notification);
  }

  /** 当前用户通知列表（分页，含 actor 信息） */
  async findAll(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<PaginatedResult<Notification>> {
    const { page = 1, pageSize = 20 } = query;

    const [data, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
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

  /** 未读数量 */
  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  /** 全部标记已读 */
  async readAll(userId: string): Promise<{ success: boolean }> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  /** 单条标记已读 */
  async readOne(userId: string, id: string): Promise<{ success: boolean }> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('通知不存在');
    }
    if (!notification.isRead) {
      notification.isRead = true;
      await this.notificationRepo.save(notification);
    }
    return { success: true };
  }
}
