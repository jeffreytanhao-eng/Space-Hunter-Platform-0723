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
import { EventSignup } from './event-signup.entity';

/** 活动表 */
@Entity('events')
export class Event {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 创建者 */
  @Column({ type: 'bigint', name: 'creator_id' })
  creatorId: string;

  /** 活动标题 */
  @Column({ type: 'varchar', length: 200 })
  title: string;

  /** 活动描述 */
  @Column({ type: 'text' })
  description: string;

  /** 开始时间 */
  @Column({ type: 'timestamptz', name: 'start_time' })
  startTime: Date;

  /** 结束时间 */
  @Column({ type: 'timestamptz', nullable: true, name: 'end_time' })
  endTime: Date | null;

  /** 地点类型: online/offline */
  @Column({ type: 'varchar', length: 20, name: 'location_type' })
  locationType: string;

  /** 地点 */
  @Column({ type: 'varchar', length: 512, nullable: true })
  location: string | null;

  /** 最大参与人数 */
  @Column({ type: 'int', nullable: true, name: 'max_participants' })
  maxParticipants: number | null;

  /** 当前参与人数 */
  @Column({ type: 'int', default: 0, name: 'current_participants' })
  currentParticipants: number;

  /** 状态: pending/approved/rejected/cancelled */
  @Column({ type: 'varchar', length: 24, default: 'pending' })
  status: string;

  /** 是否官方活动 */
  @Column({ type: 'boolean', default: false, name: 'is_official' })
  isOfficial: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // --- 关系 ---

  @ManyToOne(() => User, (user) => user.events)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => EventSignup, (signup) => signup.event)
  signups: EventSignup[];
}
