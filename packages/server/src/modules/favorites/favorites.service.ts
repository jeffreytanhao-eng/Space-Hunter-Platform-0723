import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';
import { Post } from '../../database/entities/post.entity';
import { GalleryPhoto } from '../../database/entities/gallery-photo.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { QueryFavoritesDto } from './dto/query-favorites.dto';

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(GalleryPhoto)
    private readonly galleryRepo: Repository<GalleryPhoto>,
  ) {}

  /** 收藏（幂等：已收藏则直接返回） */
  async favorite(
    userId: string,
    dto: CreateFavoriteDto,
  ): Promise<{ favorited: boolean }> {
    const { targetType, targetId } = dto;

    const existing = await this.favoriteRepo.findOne({
      where: { userId, targetType, targetId },
    });
    if (existing) {
      return { favorited: true };
    }

    const fav = this.favoriteRepo.create({ userId, targetType, targetId });
    await this.favoriteRepo.save(fav);

    // post 实体没有 favorite_count 字段，跳过计数（保持最小改动）
    return { favorited: true };
  }

  /** 取消收藏（幂等：无记录则返回 false） */
  async unfavorite(
    userId: string,
    targetType: string,
    targetId: string,
  ): Promise<{ favorited: boolean }> {
    const existing = await this.favoriteRepo.findOne({
      where: { userId, targetType, targetId },
    });
    if (!existing) {
      return { favorited: false };
    }
    await this.favoriteRepo.remove(existing);
    return { favorited: false };
  }

  /** 当前用户收藏列表（分页，附带收藏对象信息） */
  async findAll(
    userId: string,
    query: QueryFavoritesDto,
  ): Promise<PaginatedResult<any>> {
    const { targetType, page = 1, pageSize = 20 } = query;

    const where: any = { userId };
    if (targetType) {
      where.targetType = targetType;
    }

    const [data, total] = await this.favoriteRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 附加收藏对象信息
    const targets = await this.attachTargets(data);

    return {
      data: targets,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** 查询当前用户是否已收藏某对象 */
  async isFavorited(
    userId: string,
    targetType: string,
    targetId: string,
  ): Promise<{ favorited: boolean }> {
    const existing = await this.favoriteRepo.findOne({
      where: { userId, targetType, targetId },
    });
    return { favorited: !!existing };
  }

  /** 为收藏记录附加目标对象信息 */
  private async attachTargets(favorites: Favorite[]): Promise<any[]> {
    const postIds = favorites
      .filter((f) => f.targetType === 'post')
      .map((f) => f.targetId);
    const galleryIds = favorites
      .filter((f) => f.targetType === 'gallery')
      .map((f) => f.targetId);

    const [posts, galleries] = await Promise.all([
      postIds.length > 0
        ? this.postRepo.findByIds(postIds)
        : Promise.resolve([]),
      galleryIds.length > 0
        ? this.galleryRepo.findByIds(galleryIds)
        : Promise.resolve([]),
    ]);

    const postMap = new Map(posts.map((p) => [p.id, p]));
    const galleryMap = new Map(galleries.map((g) => [g.id, g]));

    return favorites.map((f) => {
      if (f.targetType === 'post') {
        const post = postMap.get(f.targetId);
        const images = post?.images || [];
        const target = post
          ? {
              id: post.id,
              title: post.title,
              images,
              cover: images.length > 0 ? (images[0] as any)?.url || null : null,
            }
          : null;
        return { ...f, target };
      }
      // gallery
      const gallery = galleryMap.get(f.targetId);
      return { ...f, target: gallery || null };
    });
  }
}
