import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/** 积分流水表 (ADR-006 幂等键) */
@Entity('points_transactions')
export class PointsTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  /** 类型: earn/spend */
  @Column({ type: 'varchar', length: 10 })
  type: string;

  /** 积分数量（正数） */
  @Column({ type: 'bigint' })
  amount: string;

  /** 来源类型 */
  @Column({ type: 'varchar', length: 30 })
  source: string;

  /** 关联源 ID */
  @Column({ type: 'bigint', nullable: true, name: 'source_id' })
  sourceId: string | null;

  /** 描述 */
  @Column({ type: 'varchar', length: 200 })
  description: string;

  /** 幂等键 (ADR-006) */
  @Column({ type: 'varchar', length: 64, unique: true, name: 'idempotency_key' })
  idempotencyKey: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.pointsTransactions)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
