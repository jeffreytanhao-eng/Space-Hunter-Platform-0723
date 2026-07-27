﻿﻿﻿﻿﻿﻿import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DeviceProcessingTask } from './device-processing-task.entity';

/** 设备上传表（设备模块预留，Phase 0 不创建 devices 表） */
@Entity('device_uploads')
export class DeviceUpload {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 预留设备 ID */
  @Column({ type: 'bigint', nullable: true, name: 'device_id' })
  deviceId: string | null;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 512, name: 'file_url' })
  fileUrl: string;

  /** 文件类型: fits/image/raw */
  @Column({ type: 'varchar', length: 20, name: 'file_type' })
  fileType: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.deviceUploads)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => DeviceProcessingTask, (task) => task.upload)
  processingTasks: DeviceProcessingTask[];
}
