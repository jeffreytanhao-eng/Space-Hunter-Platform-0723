﻿﻿﻿﻿﻿import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';

/** 图库照片表 */
@Entity('gallery_photos')
export class GalleryPhoto {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 上传用户 */
  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  /** 关联帖子 */
  @Column({ type: 'bigint', nullable: true, name: 'post_id' })
  postId: string | null;

  /** 照片标题 */
  @Column({ type: 'varchar', length: 200 })
  title: string;

  /** 照片描述 */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** 图片/预览图 URL */
  @Column({ type: 'varchar', length: 512, name: 'image_url' })
  imageUrl: string;

  /** 原始文件 URL */
  @Column({ type: 'varchar', length: 512, nullable: true, name: 'original_url' })
  originalUrl: string | null;

  /** FITS 元数据 */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  /** 分类 */
  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null;

  /** 状态: pending/approved/rejected/hidden */
  @Column({ type: 'varchar', length: 24, default: 'pending' })
  status: string;

  /** AI 初筛结果（本地敏感词过滤） */
  @Column({ type: 'jsonb', nullable: true })
  moderation: { result: 'pass' | 'suspect' | 'block'; matchedCategories: string[]; matchedKeywords: string[]; checkedAt: string } | null;

  /** 通过后发放积分 */
  @Column({ type: 'int', default: 0, name: 'points_awarded' })
  pointsAwarded: number;

  /** 点赞数 */
  @Column({ type: 'int', default: 0, name: 'like_count' })
  likeCount: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // --- 关系 ---

  @ManyToOne(() => User, (user) => user.galleryPhotos)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Post, (post) => post.galleryPhotos, { nullable: true })
  @JoinColumn({ name: 'post_id' })
  post: Post | null;
}
