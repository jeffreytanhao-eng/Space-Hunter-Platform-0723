﻿﻿﻿﻿﻿﻿import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

/** FITS 资产表 */
@Entity('fits_assets')
export class FitsAsset {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 异步处理任务 ID */
  @Column({ type: 'uuid', unique: true, name: 'job_id' })
  jobId: string;

  @Column({ type: 'bigint', name: 'post_id' })
  postId: string;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  /** 文件格式: fits/tiff/cr2/nef/arw */
  @Column({ type: 'varchar', length: 16 })
  format: string;

  @Column({ type: 'varchar', length: 512, name: 'original_url' })
  originalUrl: string;

  /** 原始文件大小 (bytes) */
  @Column({ type: 'bigint', name: 'original_size' })
  originalSize: string;

  @Column({ type: 'varchar', length: 512, nullable: true, name: 'preview_url' })
  previewUrl: string | null;

  /** 预览图大小 (bytes) */
  @Column({ type: 'bigint', nullable: true, name: 'preview_size' })
  previewSize: string | null;

  /** FITS 元数据 */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  /** 状态: pending/processing/ready/failed */
  @Column({ type: 'varchar', length: 24, default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ type: 'int', default: 0, name: 'retry_count' })
  retryCount: number;

  /** 幂等键 */
  @Column({ type: 'varchar', length: 64, unique: true, name: 'idempotency_key' })
  idempotencyKey: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @ManyToOne(() => Post, (post) => post.fitsAssets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User, (user) => user.fitsAssets)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
