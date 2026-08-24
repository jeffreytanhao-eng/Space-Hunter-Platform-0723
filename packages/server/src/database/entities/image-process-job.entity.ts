import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** 图像处理任务状态 */
export type JobStatus = 'pending' | 'processing' | 'done' | 'failed';

/**
 * 图像处理任务表
 * 记录双通道（A 保真增强 / B AI渲染）处理的输入、参数和结果
 */
@Entity('image_process_jobs')
@Index('idx_process_session_created', ['sessionId', 'createdAt'])
export class ImageProcessJob {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 匿名会话标识（cookie 指纹，无需登录） */
  @Column({ type: 'varchar', length: 64, name: 'session_id' })
  sessionId: string;

  // ---- 原始图片 ----
  @Column({ type: 'varchar', length: 512, name: 'original_path' })
  originalPath: string;

  @Column({ type: 'varchar', length: 256, name: 'original_name' })
  originalName: string;

  @Column({ type: 'int', name: 'original_size' })
  originalSize: number;

  @Column({ type: 'int', name: 'original_width' })
  originalWidth: number;

  @Column({ type: 'int', name: 'original_height' })
  originalHeight: number;

  // ---- 通道 A：保真增强 ----
  @Column({ type: 'varchar', length: 512, nullable: true, name: 'channel_a_path' })
  channelAPath: string | null;

  @Column({ type: 'int', nullable: true, name: 'channel_a_size' })
  channelASize: number | null;

  @Column({ type: 'int', nullable: true, name: 'channel_a_width' })
  channelAWidth: number | null;

  @Column({ type: 'int', nullable: true, name: 'channel_a_height' })
  channelAHeight: number | null;

  @Column({ type: 'jsonb', nullable: true, name: 'channel_a_params' })
  channelAParams: Record<string, any> | null;

  @Column({ type: 'varchar', length: 24, default: 'pending', name: 'channel_a_status' })
  channelAStatus: string;

  @Column({ type: 'text', nullable: true, name: 'channel_a_error' })
  channelAError: string | null;

  // ---- 通道 B：AI 渲染（占位）----
  @Column({ type: 'varchar', length: 512, nullable: true, name: 'channel_b_path' })
  channelBPath: string | null;

  @Column({ type: 'int', nullable: true, name: 'channel_b_size' })
  channelBSize: number | null;

  @Column({ type: 'int', nullable: true, name: 'channel_b_width' })
  channelBWidth: number | null;

  @Column({ type: 'int', nullable: true, name: 'channel_b_height' })
  channelBHeight: number | null;

  @Column({ type: 'jsonb', nullable: true, name: 'channel_b_params' })
  channelBParams: Record<string, any> | null;

  @Column({ type: 'varchar', length: 24, default: 'pending', name: 'channel_b_status' })
  channelBStatus: string;

  @Column({ type: 'text', nullable: true, name: 'channel_b_error' })
  channelBError: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
