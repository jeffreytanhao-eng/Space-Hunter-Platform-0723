import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GalleryPhoto } from '../../database/entities/gallery-photo.entity';
import { Post } from '../../database/entities/post.entity';
import { AdminLog } from '../../database/entities/admin-log.entity';
import { FitsAsset } from '../../database/entities/fits-asset.entity';
import { User } from '../../database/entities/user.entity';
import { PointsService } from '../points/points.service';
import { CosService } from '../upload/cos.service';
import { RedisService } from '../redis/redis.service';
import { ApplyGalleryDto } from './dto/apply-gallery.dto';
import { ReviewGalleryDto } from './dto/review-gallery.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(GalleryPhoto)
    private readonly galleryRepo: Repository<GalleryPhoto>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(AdminLog)
    private readonly adminLogRepo: Repository<AdminLog>,
    @InjectRepository(FitsAsset)
    private readonly fitsAssetRepo: Repository<FitsAsset>,
    private readonly pointsService: PointsService,
    private readonly cosService: CosService,
    private readonly redisService: RedisService,
  ) {}

  /** 画廊列表（仅 approved） */
  async findAll(query: QueryGalleryDto): Promise<PaginatedResult<GalleryPhoto>> {
    const { category, keyword, sortBy = 'time', page = 1, pageSize = 20 } = query;

    const qb = this.galleryRepo
      .createQueryBuilder('g')
      .where('g.status = :status', { status: 'approved' });

    // 分类筛选
    if (category) {
      qb.andWhere('g.category = :category', { category });
    }

    // 关键词搜索
    if (keyword) {
      qb.andWhere(
        '(g.title ILIKE :keyword OR g.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 排序
    if (sortBy === 'likes') {
      qb.orderBy('g.like_count', 'DESC');
    } else {
      qb.orderBy('g.createdAt', 'DESC');
    }

    // 分页
    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    // 手动查询用户信息并组装
    const userIds = [...new Set(data.map(p => p.userId))];
    if (userIds.length > 0) {
      const users = await this.galleryRepo.manager.getRepository(User).findByIds(userIds);
      const userMap = new Map(users.map((u: any) => [u.id, u] as [any, any]));
      (data as any[]).forEach(photo => {
        photo.user = userMap.get(photo.userId) || null;
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

  /** 画廊详情（含 FITS 元数据 + 原始文件下载链接） */
  async findById(id: string): Promise<GalleryPhoto & { downloadUrl?: string }> {
    const photo = await this.galleryRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!photo) {
      throw new NotFoundException('画廊照片不存在');
    }

    // 生成原始文件下载链接（5分钟签名 URL）
    let downloadUrl: string | undefined;
    if (photo.originalUrl) {
      try {
        // 从 URL 提取 COS key
        const key = this.extractCosKey(photo.originalUrl);
        downloadUrl = await this.cosService.getSignedUrl(key, 300);
      } catch {
        // 签名失败时返回原始 URL
        downloadUrl = photo.originalUrl;
      }
    }

    // 如果有关联帖子，查询 FITS 元数据补充
    let fitsMetadata: Record<string, any> | null = photo.metadata;
    if (photo.postId && !fitsMetadata) {
      const fitsAsset = await this.fitsAssetRepo.findOne({
        where: { postId: photo.postId },
      });
      if (fitsAsset) {
        fitsMetadata = fitsAsset.metadata;
      }
    }

    return { ...photo, metadata: fitsMetadata, downloadUrl };
  }

  /** 申请进入画廊（ADR-004: 人工终审） */
  async apply(userId: string, dto: ApplyGalleryDto): Promise<GalleryPhoto> {
    // 必须提供 postId 或 imageUrl
    if (!dto.postId && !dto.imageUrl) {
      throw new BadRequestException('必须提供 postId 或 imageUrl');
    }

    let imageUrl = dto.imageUrl || '';
    let originalUrl: string | null = null;
    let metadata: Record<string, any> | null = null;

    // 从关联帖子获取图片信息
    if (dto.postId) {
      const post = await this.postRepo.findOne({ where: { id: dto.postId } });
      if (!post) {
        throw new NotFoundException('关联帖子不存在');
      }
      if (post.status !== 'published') {
        throw new BadRequestException('只能从已发布帖子申请进入画廊');
      }
      // 取帖子第一张图作为画廊图片
      if (!imageUrl && post.images && post.images.length > 0) {
        imageUrl = post.images[0].url;
      }

      // 查询 FITS 资产获取元数据和原始文件
      const fitsAsset = await this.fitsAssetRepo.findOne({
        where: { postId: dto.postId },
      });
      if (fitsAsset) {
        originalUrl = fitsAsset.originalUrl;
        metadata = fitsAsset.metadata;
      }
    }

    if (!imageUrl) {
      throw new BadRequestException('无法获取图片 URL');
    }

    const photo = this.galleryRepo.create({
      userId,
      postId: dto.postId || null,
      title: dto.title,
      description: dto.description || null,
      imageUrl,
      originalUrl,
      metadata,
      category: dto.category || null,
      status: 'pending', // ADR-004: 画廊申请必须人工终审
    });

    return this.galleryRepo.save(photo);
  }

  /** 管理员审核画廊 */
  async review(adminId: string, id: string, dto: ReviewGalleryDto): Promise<GalleryPhoto> {
    const photo = await this.galleryRepo.findOne({ where: { id } });
    if (!photo) {
      throw new NotFoundException('画廊照片不存在');
    }

    if (photo.status !== 'pending') {
      throw new BadRequestException('该照片已审核');
    }

    photo.status = dto.status;

    // 审核通过：自动发放大量积分 +100
    if (dto.status === 'approved') {
      photo.pointsAwarded = 100;
      await this.pointsService.earnPoints(
        photo.userId,
        100,
        'gallery_approved',
        photo.id,
        `gallery_approved:${photo.id}`,
        '画廊审核通过奖励',
      );
    }

    const saved = await this.galleryRepo.save(photo);

    // 写入 admin_logs
    await this.adminLogRepo.save(
      this.adminLogRepo.create({
        adminId,
        action: `gallery_${dto.status}`,
        targetType: 'gallery',
        targetId: id,
        detail: {
          reason: dto.reason || null,
          pointsAwarded: dto.status === 'approved' ? 100 : 0,
        },
      }),
    );

    return saved;
  }

  /** 下载原始文件 */
  async downloadOriginal(id: string, userId: string): Promise<{ downloadUrl: string }> {
    const photo = await this.galleryRepo.findOne({ where: { id } });
    if (!photo) {
      throw new NotFoundException('画廊照片不存在');
    }

    if (!photo.originalUrl) {
      throw new NotFoundException('原始文件不存在');
    }

    // 防滥用：5分钟内同用户 ≤10 次
    const rateLimitKey = `gallery:download:${userId}`;
    const count = await this.redisService.get(rateLimitKey);
    if (count && parseInt(count, 10) >= 10) {
      throw new BadRequestException('下载过于频繁，请5分钟后再试');
    }

    // 更新计数
    if (count) {
      await this.redisService.set(rateLimitKey, String(parseInt(count, 10) + 1));
    } else {
      await this.redisService.set(rateLimitKey, '1', 300); // 5分钟过期
    }

    // 生成签名 URL（5分钟有效）
    const key = this.extractCosKey(photo.originalUrl);
    const downloadUrl = await this.cosService.getSignedUrl(key, 300);

    return { downloadUrl };
  }

  /** 画廊点赞切换（Redis 标记防重复，DB like_count 持久化） */
  async toggleLike(userId: string, photoId: string): Promise<{ liked: boolean; likesCount: number }> {
    const photo = await this.galleryRepo.findOne({ where: { id: photoId } });
    if (!photo) {
      throw new NotFoundException('画廊照片不存在');
    }

    const likeKey = `gallery:like:${userId}:${photoId}`;
    const liked = await this.redisService.get(likeKey);

    if (liked) {
      // 取消点赞
      await this.redisService.del(likeKey);
      photo.likeCount = Math.max(0, photo.likeCount - 1);
    } else {
      // 点赞（标记 1 年过期，避免长期占用）
      await this.redisService.set(likeKey, '1', 60 * 60 * 24 * 365);
      photo.likeCount = photo.likeCount + 1;
    }

    await this.galleryRepo.save(photo);
    return { liked: !liked, likesCount: photo.likeCount };
  }

  /** 获取待审核画廊列表（供 Admin 模块调用） */
  async getPending(query: { page?: number; pageSize?: number }): Promise<PaginatedResult<GalleryPhoto>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const qb = this.galleryRepo
      .createQueryBuilder('g')
      .where('g.status = :status', { status: 'pending' })
      .orderBy('g.createdAt', 'ASC');

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    // 手动查询用户信息并组装
    const userIds = [...new Set(data.map(p => p.userId))];
    if (userIds.length > 0) {
      const users = await this.galleryRepo.manager.getRepository(User).findByIds(userIds);
      const userMap = new Map(users.map((u: any) => [u.id, u] as [any, any]));
      (data as any[]).forEach(photo => {
        photo.user = userMap.get(photo.userId) || null;
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

  /** 从 URL 提取 COS key */
  private extractCosKey(url: string): string {
    try {
      const parsed = new URL(url);
      // 去掉开头的 /
      return parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
    } catch {
      // 如果不是合法 URL，直接当作 key
      return url;
    }
  }
}
