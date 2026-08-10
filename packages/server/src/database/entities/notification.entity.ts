import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/** 站内通知表 */
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 接收者用户 ID */
  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  /** 类型: like/comment/follow/system */
  @Column({ type: 'varchar', length: 20 })
  type: string;

  /** 触发者用户 ID */
  @Column({ type: 'bigint', nullable: true, name: 'actor_id' })
  actorId: string | null;

  /** 关联对象类型 */
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'target_type' })
  targetType: string | null;

  /** 关联对象 ID */
  @Column({ type: 'bigint', nullable: true, name: 'target_id' })
  targetId: string | null;

  /** 通知内容 */
  @Column({ type: 'varchar', length: 200 })
  content: string;

  /** 是否已读 */
  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // --- 关系 ---

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User;
}
