import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../database/entities/user.entity';

/** 收藏表 */
@Entity('favorites')
@Unique('UQ_favorites_triplet', ['userId', 'targetType', 'targetId'])
export class Favorite {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 收藏用户 */
  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  /** 收藏对象类型: post/gallery */
  @Column({ type: 'varchar', length: 10, name: 'target_type' })
  targetType: string;

  /** 收藏对象 ID */
  @Column({ type: 'bigint', name: 'target_id' })
  targetId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // --- 关系 ---

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
