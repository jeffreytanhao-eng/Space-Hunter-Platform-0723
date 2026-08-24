import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event } from '../../database/entities/event.entity';
import { EventSignup } from '../../database/entities/event-signup.entity';
import { AdminLog } from '../../database/entities/admin-log.entity';
import { User } from '../../database/entities/user.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { ReviewEventDto } from './dto/review-event.dto';
import { QueryEventDto } from './dto/query-event.dto';

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventSignup)
    private readonly signupRepo: Repository<EventSignup>,
    @InjectRepository(AdminLog)
    private readonly adminLogRepo: Repository<AdminLog>,
  ) {}

  /** 活动列表（仅 approved / ongoing） */
  async findAll(query: QueryEventDto, userId?: string): Promise<PaginatedResult<Event>> {
    const { keyword, locationType, page = 1, pageSize = 20 } = query;

    const qb = this.eventRepo
      .createQueryBuilder('e')
      .where('e.status IN (:...statuses)', { statuses: ['approved', 'ongoing'] });

    // 关键词搜索
    if (keyword) {
      qb.andWhere(
        '(e.title ILIKE :keyword OR e.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 地点类型筛选
    if (locationType) {
      qb.andWhere('e.location_type = :locationType', { locationType });
    }

    qb.orderBy('e.start_time', 'DESC');

    // 分页
    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    // 手动查询创建者信息并组装
    const creatorIds = [...new Set(data.map(e => e.creatorId))];
    if (creatorIds.length > 0) {
      const users = await this.eventRepo.manager.getRepository(User).findByIds(creatorIds);
      const userMap = new Map(users.map((u: any) => [u.id, u] as [any, any]));
      (data as any[]).forEach(event => {
        event.creator = userMap.get(event.creatorId) || null;
      });
    }

    // 当前用户报名状态
    if (userId && data.length > 0) {
      const eventIds = data.map(e => e.id);
      const signups = await this.signupRepo.find({
        where: { userId, status: 'signed', eventId: In(eventIds) },
      });
      const signedIds = new Set(signups.map(s => s.eventId));
      (data as any[]).forEach(event => {
        (event as any).isSignedUp = signedIds.has(event.id);
      });
    }

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** 活动详情 */
  async findById(id: string, userId?: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['creator', 'signups', 'signups.user'],
    });
    if (!event) {
      throw new NotFoundException('活动不存在');
    }
    // 当前用户报名状态
    if (userId) {
      const signup = await this.signupRepo.findOne({
        where: { eventId: id, userId, status: 'signed' },
      });
      (event as any).isSignedUp = !!signup;
    }
    return event;
  }

  /** 创建活动（需审核） */
  async create(userId: string, dto: CreateEventDto): Promise<Event> {
    const event = this.eventRepo.create({
      creatorId: userId,
      title: dto.title,
      description: dto.description,
      startTime: new Date(dto.startTime),
      endTime: dto.endTime ? new Date(dto.endTime) : null,
      locationType: dto.locationType,
      location: dto.location || null,
      maxParticipants: dto.maxParticipants || null,
      status: 'pending',
      isOfficial: false,
    });
    return this.eventRepo.save(event);
  }

  /** 报名活动 */
  async signup(userId: string, eventId: string): Promise<EventSignup> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('活动不存在');
    }
    if (event.status !== 'approved' && event.status !== 'ongoing') {
      throw new BadRequestException('活动未开放报名');
    }

    // 检查是否已报名
    const existing = await this.signupRepo.findOne({
      where: { eventId, userId, status: 'signed' },
    });
    if (existing) {
      throw new BadRequestException('已报名该活动');
    }

    // 检查是否满员
    if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
      throw new BadRequestException('活动已满员');
    }

    // 创建报名记录 + 增加参与人数
    const signup = this.signupRepo.create({
      eventId,
      userId,
      status: 'signed',
    });
    await this.signupRepo.save(signup);

    event.currentParticipants += 1;
    await this.eventRepo.save(event);

    return signup;
  }

  /** 取消报名 */
  async cancelSignup(userId: string, eventId: string): Promise<void> {
    const signup = await this.signupRepo.findOne({
      where: { eventId, userId, status: 'signed' },
    });
    if (!signup) {
      throw new BadRequestException('未报名该活动');
    }

    // 更新报名状态 + 减少参与人数
    signup.status = 'cancelled';
    await this.signupRepo.save(signup);

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (event) {
      event.currentParticipants = Math.max(0, event.currentParticipants - 1);
      await this.eventRepo.save(event);
    }
  }

  /** 我的活动列表 */
  async getMyEvents(userId: string, query: QueryEventDto): Promise<PaginatedResult<Event>> {
    const { page = 1, pageSize = 20 } = query;

    const qb = this.eventRepo
      .createQueryBuilder('e')
      .innerJoin('e.signups', 's', 's.user_id = :userId AND s.status = :signupStatus', {
        userId,
        signupStatus: 'signed',
      });

    qb.orderBy('e.startTime', 'DESC');

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    // 手动查询创建者信息并组装
    const creatorIds = [...new Set(data.map(e => e.creatorId))];
    if (creatorIds.length > 0) {
      const users = await this.eventRepo.manager.getRepository(User).findByIds(creatorIds);
      const userMap = new Map(users.map((u: any) => [u.id, u] as [any, any]));
      (data as any[]).forEach(event => {
        event.creator = userMap.get(event.creatorId) || null;
      });
    }

    // 我的活动：用户必然已报名
    (data as any[]).forEach(event => {
      (event as any).isSignedUp = true;
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** 管理员审核活动 */
  async review(adminId: string, eventId: string, dto: ReviewEventDto): Promise<Event> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('活动不存在');
    }
    if (event.status !== 'pending') {
      throw new BadRequestException('该活动已审核');
    }

    event.status = dto.status;
    const saved = await this.eventRepo.save(event);

    // 写入 admin_logs
    await this.adminLogRepo.save(
      this.adminLogRepo.create({
        adminId,
        action: `event_${dto.status}`,
        targetType: 'event',
        targetId: eventId,
        detail: { reason: dto.reason || null },
      }),
    );

    return saved;
  }

  /** 官方发布活动 */
  async createOfficial(adminId: string, dto: CreateEventDto): Promise<Event> {
    const event = this.eventRepo.create({
      creatorId: adminId,
      title: dto.title,
      description: dto.description,
      startTime: new Date(dto.startTime),
      endTime: dto.endTime ? new Date(dto.endTime) : null,
      locationType: dto.locationType,
      location: dto.location || null,
      maxParticipants: dto.maxParticipants || null,
      status: 'approved', // 官方活动直接通过
      isOfficial: true,
    });
    return this.eventRepo.save(event);
  }

  /** 获取待审核活动列表（供 Admin 模块调用） */
  async getPending(query: { page?: number; pageSize?: number }): Promise<PaginatedResult<Event>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const qb = this.eventRepo
      .createQueryBuilder('e')
      .where('e.status = :status', { status: 'pending' })
      .orderBy('e.created_at', 'ASC');

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    // 手动查询创建者信息并组装
    const creatorIds = [...new Set(data.map(e => e.creatorId))];
    if (creatorIds.length > 0) {
      const users = await this.eventRepo.manager.getRepository(User).findByIds(creatorIds);
      const userMap = new Map(users.map((u: any) => [u.id, u] as [any, any]));
      (data as any[]).forEach(event => {
        event.creator = userMap.get(event.creatorId) || null;
      });
    }

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
