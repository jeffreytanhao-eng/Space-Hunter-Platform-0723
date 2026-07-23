import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Post } from '../../database/entities/post.entity';
import { GalleryPhoto } from '../../database/entities/gallery-photo.entity';
import { Event } from '../../database/entities/event.entity';
import { Section } from '../../database/entities/section.entity';
import { AdminLog } from '../../database/entities/admin-log.entity';
import { PointsTransaction } from '../../database/entities/points-transaction.entity';
import { PointsService } from '../points/points.service';
import { GalleryService } from '../gallery/gallery.service';
import { EventsService } from '../events/events.service';
import { ReviewPostDto } from './dto/review-post.dto';
import { ManageUserDto } from './dto/manage-user.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { AdminQueryDto } from './dto/admin-query.dto';

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(GalleryPhoto)
    private readonly galleryRepo: Repository<GalleryPhoto>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(AdminLog)
    private readonly adminLogRepo: Repository<AdminLog>,
    @InjectRepository(PointsTransaction)
    private readonly pointsTxRepo: Repository<PointsTransaction>,
    private readonly pointsService: PointsService,
    private readonly galleryService: GalleryService,
    private readonly eventsService: EventsService,
  ) {}

  /** 数据统计看板 */
  async getStats() {
    const [
      userCount,
      postCount,
      galleryCount,
      eventCount,
      todayUsers,
      todayPosts,
    ] = await Promise.all([
      this.userRepo.count(),
      this.postRepo.count({ where: { status: 'published' } }),
      this.galleryRepo.count({ where: { status: 'approved' } }),
      this.eventRepo.count({ where: { status: 'approved' } }),
      // 今日新增用户
      this.userRepo.count({
        where: {
          createdAt: (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today as any;
          })(),
        },
      }),
      // 今日新增帖子
      this.postRepo.count({
        where: {
          status: 'published',
          createdAt: (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today as any;
          })(),
        },
      }),
    ]);

    return {
      userCount,
      postCount,
      galleryCount,
      eventCount,
      todayUsers,
      todayPosts,
    };
  }

  /** 待审核帖子列表 */
  async getPendingPosts(query: AdminQueryDto): Promise<PaginatedResult<Post>> {
    const { page = 1, pageSize = 20, keyword } = query;

    const qb = this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .leftJoinAndSelect('p.section', 'section')
      .where('p.status IN (:...statuses)', { statuses: ['pending_auto', 'pending_manual'] });

    if (keyword) {
      qb.andWhere('(p.title ILIKE :keyword OR p.content ILIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    qb.orderBy('p.created_at', 'ASC');

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /** 审核帖子 */
  async reviewPost(adminId: string, postId: string, dto: ReviewPostDto): Promise<Post> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    post.status = dto.status;
    const saved = await this.postRepo.save(post);

    // 写入 admin_logs
    await this.adminLogRepo.save(
      this.adminLogRepo.create({
        adminId,
        action: `post_${dto.status}`,
        targetType: 'post',
        targetId: postId,
        detail: { reason: dto.reason || null },
      }),
    );

    return saved;
  }

  /** 待审核画廊列表（复用 GalleryService） */
  async getPendingGallery(query: AdminQueryDto) {
    return this.galleryService.getPending({
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  /** 待审核活动列表（复用 EventsService） */
  async getPendingEvents(query: AdminQueryDto) {
    return this.eventsService.getPending({
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  /** 待审核板块列表 */
  async getPendingSections(query: AdminQueryDto): Promise<PaginatedResult<Section>> {
    const { page = 1, pageSize = 20 } = query;

    const qb = this.sectionRepo
      .createQueryBuilder('s')
      .where('s.status = :status', { status: 'pending' })
      .orderBy('s.created_at', 'ASC');

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /** 管理板块（启用/禁用/排序） */
  async manageSection(adminId: string, sectionId: string, dto: { status?: string; sortOrder?: number }): Promise<Section> {
    const section = await this.sectionRepo.findOne({ where: { id: sectionId } });
    if (!section) {
      throw new NotFoundException('板块不存在');
    }

    if (dto.status !== undefined) section.status = dto.status;
    if (dto.sortOrder !== undefined) section.sortOrder = dto.sortOrder;

    const saved = await this.sectionRepo.save(section);

    // 写入 admin_logs
    await this.adminLogRepo.save(
      this.adminLogRepo.create({
        adminId,
        action: 'section_manage',
        targetType: 'section',
        targetId: sectionId,
        detail: dto,
      }),
    );

    return saved;
  }

  /** 用户管理列表 */
  async getUsers(query: AdminQueryDto): Promise<PaginatedResult<User>> {
    const { page = 1, pageSize = 20, keyword } = query;

    const qb = this.userRepo.createQueryBuilder('u');

    if (keyword) {
      qb.andWhere('(u.nickname ILIKE :keyword OR u.phone ILIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    qb.orderBy('u.created_at', 'DESC');

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /** 用户管理（封禁/解封/积分调整/角色） */
  async manageUser(adminId: string, userId: string, dto: ManageUserDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (dto.status !== undefined) user.status = dto.status;
    if (dto.role !== undefined) user.role = dto.role;

    const saved = await this.userRepo.save(user);

    // 积分调整
    if (dto.pointsAdjust && dto.pointsAdjust !== 0) {
      const amount = Math.abs(dto.pointsAdjust);
      const type = dto.pointsAdjust > 0 ? 'earn' : 'spend';
      const idempotencyKey = `admin_adjust:${userId}:${Date.now()}`;

      if (type === 'earn') {
        await this.pointsService.earnPoints(
          userId,
          amount,
          'admin_adjust',
          null,
          idempotencyKey,
          '管理员积分调整',
        );
      } else {
        await this.pointsService.spendPoints(
          userId,
          amount,
          'admin_adjust',
          idempotencyKey,
          '管理员积分扣减',
        );
      }
    }

    // 写入 admin_logs
    await this.adminLogRepo.save(
      this.adminLogRepo.create({
        adminId,
        action: 'user_manage',
        targetType: 'user',
        targetId: userId,
        detail: dto,
      }),
    );

    return saved;
  }

  /** 积分交易流水 */
  async getPointsTransactions(query: AdminQueryDto): Promise<PaginatedResult<PointsTransaction>> {
    const { page = 1, pageSize = 20, keyword } = query;

    const qb = this.pointsTxRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.user', 'user')
      .orderBy('tx.created_at', 'DESC');

    // keyword 筛选用户昵称或描述
    if (keyword) {
      qb.andWhere('(user.nickname ILIKE :keyword OR tx.description ILIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /** 积分调整 */
  async adjustPoints(adminId: string, dto: AdjustPointsDto): Promise<PointsTransaction> {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const amount = Math.abs(dto.amount);
    const idempotencyKey = `admin_adjust:${dto.userId}:${Date.now()}`;

    let tx: PointsTransaction;
    if (dto.amount > 0) {
      tx = await this.pointsService.earnPoints(
        dto.userId,
        amount,
        'admin_adjust',
        null,
        idempotencyKey,
        dto.description,
      );
    } else {
      tx = await this.pointsService.spendPoints(
        dto.userId,
        amount,
        'admin_adjust',
        idempotencyKey,
        dto.description,
      );
    }

    // 写入 admin_logs
    await this.adminLogRepo.save(
      this.adminLogRepo.create({
        adminId,
        action: 'points_adjust',
        targetType: 'user',
        targetId: dto.userId,
        detail: { amount: dto.amount, description: dto.description },
      }),
    );

    return tx;
  }

  /** 管理操作日志 */
  async getLogs(query: AdminQueryDto): Promise<PaginatedResult<AdminLog>> {
    const { page = 1, pageSize = 20, keyword } = query;

    const qb = this.adminLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .orderBy('log.created_at', 'DESC');

    if (keyword) {
      qb.andWhere('(log.action ILIKE :keyword OR admin.nickname ILIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
