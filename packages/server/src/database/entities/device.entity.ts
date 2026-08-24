import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { DeviceUpload } from './device-upload.entity';

/**
 * 设备绑定表 — 用户与望远镜硬件设备的一对一绑定
 * 设计来源：设备模块 Phase0 补充规格 v1.0（Task D1）
 */
@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 硬件唯一标识（设备端固件铭刻） */
  @Column({ type: 'varchar', length: 64, unique: true, name: 'hardware_id' })
  hardwareId: string;

  /** 绑定用户 */
  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  /** 设备访问令牌（绑定成功后返回，设备端持此令牌上传） */
  @Column({ type: 'varchar', length: 128, name: 'device_token' })
  deviceToken: string;

  /** 设备名称（用户可修改，可选） */
  @Column({ type: 'varchar', length: 64, nullable: true })
  name: string | null;

  /** 状态：active / inactive / unbound */
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  /** 绑定时间 */
  @CreateDateColumn({ type: 'timestamptz', default: 'NOW()' })
  boundAt: Date;

  /** 最近一次上传时间 */
  @Column({ type: 'timestamptz', nullable: true, name: 'last_upload_at' })
  lastUploadAt: Date | null;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => DeviceUpload, (u) => u.device)
  uploads: DeviceUpload[];
}