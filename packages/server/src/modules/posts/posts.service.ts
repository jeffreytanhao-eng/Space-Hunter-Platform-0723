import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like as TypeOrmLike, In } from 'typeorm';
import { Post } from '../../database/entities/post.entity';
import { Comment } from '../../database/entities/comment.entity';
import { FitsAsset } from '../../database/entities/fits-asset.entity';
import { PointsTransaction } from '../../database/entities/points-transaction.entity';
import { User } from '../../database/entities/user.entity';
import { Section } from '../../database/entities/section.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { ModerationService } from '../../common/moderation';

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(FitsAsset)
    private readonly fitsAssetRepo: Repository<FitsAsset>,
    @InjectRepository(PointsTransaction)
    private readonly pointsTxRepo: Repository<PointsTransaction>,
    private readonly moderationService: ModerationService,
  ) {}

  /** 分页查询帖子列表 */
  async findAll(query: QueryPostDto, userRole?: string): Promise<PaginatedResult<Post>> {
    const {
      sectionId,
      tags,
      tag,
      keyword,
      page = 1,
      pageSize = 20,
      sortBy = 'created_at',
      order = 'DESC',
    } = query;

    const whereConditions: string[] = [];
    const parameters: any = {};

    if (userRole !== 'admin') {
      whereConditions.push('post.status = :status');
      parameters.status = 'published';
    }

    if (sectionId) {
      whereConditions.push('post.section_id = :sectionId');
      parameters.sectionId = sectionId;
    }

    const effectiveTags = tags || (tag ? [tag] : undefined);
    if (effectiveTags && effectiveTags.length > 0) {
      whereConditions.push('post.tags @> :tags');
      parameters.tags = JSON.stringify(effectiveTags);
    }

    if (keyword) {
      whereConditions.push('(post.title ILIKE :keyword OR post.content ILIKE :keyword)');
      parameters.keyword = `%${keyword}%`;
    }

    const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : '1=1';

    const sortColumn = sortBy === 'created_at' ? 'post.created_at' : `post.${sortBy === 'like_count' ? 'like_count' : 'comment_count'}`;

    const skip = (page - 1) * pageSize;

    const queryBuilder = this.postRepo
      .createQueryBuilder('post')
      .where(whereClause, parameters)
      .orderBy(sortColumn, order)
      .skip(skip)
      .take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    const userIds = [...new Set(data.map(p => p.userId))];
    const sectionIds = [...new Set(data.map(p => p.sectionId))];

    const [users, sections] = await Promise.all([
      userIds.length > 0 ? this.postRepo.manager.getRepository(User).findByIds(userIds) : [],
      sectionIds.length > 0 ? this.postRepo.manager.getRepository(Section).findByIds(sectionIds) : [],
    ]);

    const userMap = new Map(users.map((u: any) => [u.id, u] as [any, any]));
    const sectionMap = new Map(sections.map((s: any) => [s.id, s] as [any, any]));

    (data as any[]).forEach(post => {
      post.user = userMap.get(post.userId) || null;
      post.section = sectionMap.get(post.sectionId) || null;
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** 帖子详情，含作者信息和评论 */
  async findById(id: string): Promise<Post> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const user = await this.postRepo.manager.getRepository(User).findOne({ where: { id: post.userId } });
    const section = await this.postRepo.manager.getRepository(Section).findOne({ where: { id: post.sectionId } });

    const comments = await this.commentRepo
      .createQueryBuilder('comment')
      .where('comment.post_id = :postId', { postId: id })
      .orderBy('comment.created_at', 'ASC')
      .getMany();

    const commentUserIds = [...new Set(comments.map(c => c.userId))];
    const commentUsers = commentUserIds.length > 0
      ? await this.postRepo.manager.getRepository(User).findByIds(commentUserIds)
      : [];
    const commentUserMap = new Map(commentUsers.map((u: any) => [u.id, u]));

    (comments as any[]).forEach(comment => {
      comment.user = commentUserMap.get(comment.userId) || null;
    });

    (post as any).user = user || null;
    (post as any).section = section || null;
    (post as any).comments = comments;

    return post;
  }

  /** 创建帖子 */
  async create(userId: string, dto: CreatePostDto): Promise<Post> {
    // 判断是否包含 FITS 文件
    const hasFits = dto.images?.some((img) => img.type === 'fits') ?? false;

    // 内容自动审核
    const moderationResult = this.moderationService.moderatePost(
      dto.title,
      dto.content,
      dto.tags,
    );

    let status: string;
    switch (moderationResult.result) {
      case 'pass':
        status = 'published';
        break;
      case 'suspect':
        status = 'pending_manual';
        break;
      case 'block':
        status = 'rejected';
        break;
      default:
        status = 'pending_auto';
    }

    const post = this.postRepo.create({
      userId,
      sectionId: dto.sectionId,
      title: dto.title,
      content: dto.content,
      images: dto.images ?? null,
      tags: dto.tags ?? null,
      hasFits,
      status,
    });

    const saved = await this.postRepo.save(post);

    // 仅审核通过的帖子发放积分奖励
    if (status === 'published') {
      // 发帖积分奖励 +10
      await this.earnPoints(userId, 10, 'post_create', saved.id, `发帖奖励: ${saved.title}`);

      // 上传照片积分奖励 +5（如有图片）
      if (dto.images && dto.images.length > 0) {
        await this.earnPoints(userId, 5, 'photo_upload', saved.id, '上传照片奖励');
      }

      // 专业格式上传 +20（FITS 文件差异化奖励）
      if (hasFits) {
        await this.earnPoints(userId, 20, 'fits_upload', saved.id, '专业格式上传奖励');
      }
    }

    return saved;
  }

  /** 更新帖子（仅作者可编辑） */
  async update(userId: string, postId: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.findById(postId);

    if (post.userId !== userId) {
      throw new ForbiddenException('仅作者可编辑帖子');
    }

    // 更新 FITS 标记
    if (dto.images) {
      post.hasFits = dto.images.some((img) => img.type === 'fits');
    }

    Object.assign(post, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.images !== undefined && { images: dto.images }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
    });

    // 编辑内容后重新触发审核
    const needsModeration =
      dto.title !== undefined || dto.content !== undefined || dto.tags !== undefined;

    if (needsModeration) {
      const wasPublished = post.status === 'published';
      const moderationResult = this.moderationService.moderatePost(
        post.title,
        post.content,
        post.tags,
      );

      switch (moderationResult.result) {
        case 'pass':
          post.status = 'published';
          break;
        case 'suspect':
          post.status = 'pending_manual';
          break;
        case 'block':
          post.status = 'rejected';
          break;
      }

      // 如果之前已发布，现在被下架，需要扣除积分（此处仅记录，实际积分回滚逻辑可后续完善）
      if (wasPublished && post.status !== 'published') {
        // TODO: 积分回滚逻辑
      }

      // 如果之前未通过，现在通过了，补发积分
      if (!wasPublished && post.status === 'published') {
        await this.earnPoints(userId, 10, 'post_create', post.id, `发帖奖励: ${post.title}`);
        if (post.images && post.images.length > 0) {
          await this.earnPoints(userId, 5, 'photo_upload', post.id, '上传照片奖励');
        }
        if (post.hasFits) {
          await this.earnPoints(userId, 20, 'fits_upload', post.id, '专业格式上传奖励');
        }
      }
    }

    return this.postRepo.save(post);
  }

  /** 删除帖子（仅作者或管理员） */
  async remove(userId: string, postId: string, userRole?: string): Promise<void> {
    const post = await this.findById(postId);

    if (post.userId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('仅作者或管理员可删除帖子');
    }

    await this.postRepo.remove(post);
  }

  /** 点赞/取消点赞（切换） */
  async toggleLike(userId: string, postId: string): Promise<{ liked: boolean }> {
    const post = await this.findById(postId);

    // 使用 idempotency_key 判断是否已点赞
    const idempotencyKey = `like:${userId}:${postId}`;
    const existing = await this.pointsTxRepo.findOne({
      where: { idempotencyKey },
    });

    if (existing) {
      // 已点赞 → 取消点赞
      await this.pointsTxRepo.remove(existing);
      post.likeCount = Math.max(0, post.likeCount - 1);
      await this.postRepo.save(post);
      return { liked: false };
    }

    // 首次点赞 → 记录流水 + 给帖子作者 +1 积分
    const tx = this.pointsTxRepo.create({
      userId: post.userId,
      type: 'earn',
      amount: '1',
      source: 'like_received',
      sourceId: postId,
      description: '被点赞奖励',
      idempotencyKey,
    });
    await this.pointsTxRepo.save(tx);

    post.likeCount += 1;
    await this.postRepo.save(post);

    return { liked: true };
  }

  /** 查询帖子关联的 FITS 处理状态 */
  async getFitsStatus(postId: string): Promise<FitsAsset[]> {
    return this.fitsAssetRepo.find({
      where: { postId },
      select: ['id', 'jobId', 'format', 'status', 'error', 'retryCount', 'createdAt', 'completedAt'],
    });
  }

  /** 赚取积分（内部方法，简化版，完整事务在 PointsService） */
  private async earnPoints(
    userId: string,
    amount: number,
    source: string,
    sourceId: string,
    description: string,
  ): Promise<void> {
    const idempotencyKey = `${source}:${sourceId}:${userId}`;
    // 幂等检查
    const exists = await this.pointsTxRepo.findOne({
      where: { idempotencyKey },
    });
    if (exists) return;

    const tx = this.pointsTxRepo.create({
      userId,
      type: 'earn',
      amount: String(amount),
      source,
      sourceId,
      description,
      idempotencyKey,
    });
    await this.pointsTxRepo.save(tx);
  }
}
