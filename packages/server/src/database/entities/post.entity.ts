import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Section } from './section.entity';
import { Comment } from './comment.entity';
import { GalleryPhoto } from './gallery-photo.entity';
import { FitsAsset } from './fits-asset.entity';

/** 帖子表 */
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 发帖用户 */
  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  /** 所属板块 */
  @Column({ type: 'bigint', name: 'section_id' })
  sectionId: string;

  /** 帖子标题 */
  @Column({ type: 'varchar', length: 200 })
  title: string;

  /** 帖子内容 */
  @Column({ type: 'text' })
  content: string;

  /** 图片 URL 数组 [{url, type:'image'|'fits', jobId?}] */
  @Column({ type: 'jsonb', nullable: true })
  images: { url: string; type: 'image' | 'fits'; jobId?: string }[] | null;

  /** 标签数组 */
  @Column({ type: 'jsonb', nullable: true })
  tags: string[] | null;

  /** 是否含 FITS 文件 */
  @Column({ type: 'boolean', default: false, name: 'has_fits' })
  hasFits: boolean;

  /**
   * 审核状态 (ADR-004)
   * pending_auto — 待自动审核
   * pending_manual — 待人工审核
   * published — 已发布
   * rejected — 已拒绝
   */
  @Column({ type: 'varchar', length: 24, default: 'pending_auto' })
  status: string;

  /** 点赞数 */
  @Column({ type: 'int', default: 0, name: 'like_count' })
  likeCount: number;

  /** 评论数 */
  @Column({ type: 'int', default: 0, name: 'comment_count' })
  commentCount: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // --- 关系 ---

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Section, (section) => section.posts)
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => GalleryPhoto, (photo) => photo.post)
  galleryPhotos: GalleryPhoto[];

  @OneToMany(() => FitsAsset, (asset) => asset.post)
  fitsAssets: FitsAsset[];
}
