import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/** 私信会话表（一对一，userAId < userBId 规范化存储） */
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 会话用户 A（较小的用户 ID） */
  @Column({ type: 'bigint', name: 'user_a_id' })
  userAId: string;

  /** 会话用户 B（较大的用户 ID） */
  @Column({ type: 'bigint', name: 'user_b_id' })
  userBId: string;

  /** 最后一条消息时间 */
  @Column({ type: 'timestamptz', nullable: true, name: 'last_message_at' })
  lastMessageAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
