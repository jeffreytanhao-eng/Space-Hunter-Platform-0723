﻿﻿﻿﻿﻿﻿import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from './user.entity';

/** 活动报名表 */
@Entity('event_signups')
@Unique('UQ_event_signup_pair', ['eventId', 'userId'])
export class EventSignup {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 活动 ID */
  @Column({ type: 'bigint', name: 'event_id' })
  eventId: string;

  /** 用户 ID */
  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  /** 状态: signed/cancelled */
  @Column({ type: 'varchar', length: 20, default: 'signed' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // --- 关系 ---

  @ManyToOne(() => Event, (event) => event.signups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User, (user) => user.eventSignups)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
