import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Follow } from '../../database/entities/follow.entity';
import { User } from '../../database/entities/user.entity';
import { Post } from '../../database/entities/post.entity';
import { GalleryPhoto } from '../../database/entities/gallery-photo.entity';

/** 关注动态项 */
export interface FollowFeedItem {
  id: string;
  type: 'post' | 'gallery';
  title: string;
  content?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  authorId: string;
  authorNickname: string;
  authorAvatar?: string;
  likesCount: number;
  commentsCount?: number;
  createdAt: string;
}

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class FollowFeedService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(GalleryPhoto)
    private readonly galleryRepo: Repository<GalleryPhoto>,
  ) {}

  /** 关注动态流：聚合关注用户的已发布帖子和已审核画廊照片，按时间倒序 */
  async getFeed(
    userId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResult<FollowFeedItem>> {
    const follows = await this.followRepo.find({ where: { followerId: userId } });
    if (follows.length === 0) {
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    const followingIds = follows.map((f) => String(f.followingId));

    const [posts, gallery] = await Promise.all([
      this.postRepo
        .createQueryBuilder('post')
        .where('post.user_id IN (:...ids)', { ids: followingIds })
        .andWhere('post.status = :status', { status: 'published' })
        .orderBy('post.created_at', 'DESC')
        .getMany(),
      this.galleryRepo
        .createQueryBuilder('g')
        .where('g.user_id IN (:...ids)', { ids: followingIds })
        .andWhere('g.status = :status', { status: 'approved' })
        .orderBy('g.created_at', 'DESC')
        .getMany(),
    ]);

    const items: FollowFeedItem[] = [
      ...posts.map((p) => ({
        id: String(p.id),
        type: 'post' as const,
        title: p.title,
        content: p.content,
        imageUrl: p.images && p.images.length > 0 ? p.images[0].url : undefined,
        thumbnailUrl: p.images && p.images.length > 0 ? p.images[0].url : undefined,
        authorId: String(p.userId),
        authorNickname: '',
        likesCount: p.likeCount,
        commentsCount: p.commentCount,
        createdAt: p.createdAt.toISOString(),
      })),
      ...gallery.map((g) => ({
        id: String(g.id),
        type: 'gallery' as const,
        title: g.title,
        content: g.description ?? undefined,
        imageUrl: g.imageUrl,
        thumbnailUrl: g.imageUrl,
        authorId: String(g.userId),
        authorNickname: '',
        likesCount: g.likeCount,
        createdAt: g.createdAt.toISOString(),
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // 填充作者信息
    const authorIds = [...new Set(items.map((i) => i.authorId))];
    if (authorIds.length > 0) {
      const users = await this.userRepo.find({ where: { id: In(authorIds) } });
      const userMap = new Map(users.map((u) => [String(u.id), u]));
      items.forEach((item) => {
        const u = userMap.get(item.authorId);
        if (u) {
          item.authorNickname = u.nickname;
          item.authorAvatar = u.avatar ?? undefined;
        }
      });
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    const data = items.slice(start, start + pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
