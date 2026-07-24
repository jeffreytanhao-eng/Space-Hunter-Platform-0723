import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

/** 关注关系表 */
@Entity('follows')
@Unique('UQ_follows_pair', ['followerId', 'followingId'])
export class Follow {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 关注者 */
  @Column({ type: 'bigint', name: 'follower_id' })
  followerId: string;

  /** 被关注者 */
  @Column({ type: 'bigint', name: 'following_id' })
  followingId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // --- 关系 ---

  @ManyToOne(() => User, (user) => user.following)
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @ManyToOne(() => User, (user) => user.followers)
  @JoinColumn({ name: 'following_id' })
  following: User;
}
