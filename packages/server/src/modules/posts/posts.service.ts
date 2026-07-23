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
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';

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
  ) {}

  /** 分页查询帖子列表 */
  async findAll(query: QueryPostDto, userRole?: string): Promise<PaginatedResult<Post>> {
    const {
      sectionId,
      tags,
      keyword,
      page = 1,
      pageSize = 20,
      sortBy = 'created_at',
      order = 'DESC',
    } = query;

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.section', 'section');

    // 非管理员只能看 published
    if (userRole !== 'admin') {
      qb.andWhere('post.status = :status', { status: 'published' });
    }

    // 板块筛选
    if (sectionId) {
      qb.andWhere('post.section_id = :sectionId', { sectionId });
    }

    // 标签筛选（JSONB 包含）
    if (tags && tags.length > 0) {
      qb.andWhere('post.tags @> :tags', { tags: JSON.stringify(tags) });
    }

    // 关键词搜索
    if (keyword) {
      qb.andWhere(
        '(post.title ILIKE :keyword OR post.content ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 排序
    const sortColumn = sortBy === 'created_at' ? 'post.created_at' : `post.${sortBy === 'like_count' ? 'like_count' : 'comment_count'}`;
    qb.orderBy(sortColumn, order);

    // 分页
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

  /** 帖子详情，含作者信息和评论 */
  async findById(id: string): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['user', 'section', 'comments', 'comments.user'],
    });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }
    return post;
  }

  /** 创建帖子 */
  async create(userId: string, dto: CreatePostDto): Promise<Post> {
    // 判断是否包含 FITS 文件
    const hasFits = dto.images?.some((img) => img.type === 'fits') ?? false;

    const post = this.postRepo.create({
      userId,
      sectionId: dto.sectionId,
      title: dto.title,
      content: dto.content,
      images: dto.images ?? null,
      tags: dto.tags ?? null,
      hasFits,
      // Phase 0 规则层简化：无关键词黑名单，直接设为 published
      // TODO: Phase 1 接入腾讯云内容安全 API
      status: 'published',
    });

    const saved = await this.postRepo.save(post);

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
