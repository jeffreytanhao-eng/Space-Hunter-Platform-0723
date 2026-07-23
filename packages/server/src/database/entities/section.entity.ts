import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';

/** 板块表 */
@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 板块名称 */
  @Column({ type: 'varchar', length: 64 })
  name: string;

  /** 板块描述 */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** 板块图标 URL */
  @Column({ type: 'varchar', length: 512, nullable: true })
  icon: string | null;

  /** 排序权重 */
  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  /** 用户申请时填入 */
  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  createdBy: string | null;

  /** 状态: pending/approved/disabled */
  @Column({ type: 'varchar', length: 20, default: 'approved' })
  status: string;

  /** 帖子数量 */
  @Column({ type: 'int', default: 0, name: 'post_count' })
  postCount: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // --- 关系 ---

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @OneToMany(() => Post, (post) => post.section)
  posts: Post[];
}
