import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DeviceUpload } from './device-upload.entity';

/** 设备处理任务表（设备模块预留） */
@Entity('device_processing_tasks')
export class DeviceProcessingTask {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'upload_id' })
  uploadId: string;

  /** 任务类型: ai_detect/ai_classify/ai_score/ai_enhance/fits_process */
  @Column({ type: 'varchar', length: 30 })
  type: string;

  /** 状态: pending/processing/done/failed */
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'finished_at' })
  finishedAt: Date | null;

  @ManyToOne(() => DeviceUpload, (upload) => upload.processingTasks)
  @JoinColumn({ name: 'upload_id' })
  upload: DeviceUpload;
}
