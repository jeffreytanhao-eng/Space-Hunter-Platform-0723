import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

/** 每日签到记录表 */
@Entity('check_ins')
@Unique('UQ_check_ins_user_date', ['userId', 'checkinDate'])
export class CheckIn {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 签到用户 */
  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  /** 签到日期 (YYYY-MM-DD) */
  @Column({ type: 'varchar', length: 10, name: 'checkin_date' })
  checkinDate: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
