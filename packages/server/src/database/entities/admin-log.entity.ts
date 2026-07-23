import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/** 管理员操作日志表 */
@Entity('admin_logs')
export class AdminLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'admin_id' })
  adminId: string;

  /** 操作类型 */
  @Column({ type: 'varchar', length: 50 })
  action: string;

  /** 目标类型: post/gallery/event/section/user */
  @Column({ type: 'varchar', length: 30, name: 'target_type' })
  targetType: string;

  /** 目标 ID */
  @Column({ type: 'bigint', nullable: true, name: 'target_id' })
  targetId: string | null;

  /** 操作详情 */
  @Column({ type: 'jsonb', nullable: true })
  detail: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.adminLogs)
  @JoinColumn({ name: 'admin_id' })
  admin: User;
}
