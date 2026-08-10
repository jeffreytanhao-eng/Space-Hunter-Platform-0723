import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/** 私信消息表 */
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 所属会话 */
  @Column({ type: 'bigint', name: 'conversation_id' })
  conversationId: string;

  /** 发送者 */
  @Column({ type: 'bigint', name: 'sender_id' })
  senderId: string;

  /** 消息内容 */
  @Column({ type: 'text' })
  content: string;

  /** 是否已读 */
  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // --- 关系 ---

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender: User;
}
