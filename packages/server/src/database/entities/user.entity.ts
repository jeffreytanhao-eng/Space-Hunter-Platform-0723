import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  OneToMany,
} from 'typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { Follow } from './follow.entity';
import { GalleryPhoto } from './gallery-photo.entity';
import { Event } from './event.entity';
import { EventSignup } from './event-signup.entity';
import { PointsTransaction } from './points-transaction.entity';
import { AdminLog } from './admin-log.entity';
import { FitsAsset } from './fits-asset.entity';
import { DeviceUpload } from './device-upload.entity';

/** 用户表 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 手机号 */
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone: string | null;

  /** 微信 openid */
  @Column({ type: 'varchar', length: 64, unique: true, nullable: true, name: 'wechat_openid' })
  wechatOpenid: string | null;

  /** 昵称 */
  @Column({ type: 'varchar', length: 64 })
  nickname: string;

  /** 头像 URL */
  @Column({ type: 'varchar', length: 512, nullable: true })
  avatar: string | null;

  /** 个人简介 */
  @Column({ type: 'text', nullable: true })
  bio: string | null;

  /** 天文兴趣标签数组 */
  @Column({ type: 'jsonb', nullable: true })
  interests: string[] | null;

  /** 设备信息 */
  @Column({ type: 'text', nullable: true })
  equipment: string | null;

  /** 积分余额 */
  @Column({ type: 'bigint', default: 0, name: 'points_balance' })
  pointsBalance: string;

  /** 乐观锁版本号 */
  @VersionColumn({ type: 'int', default: 1 })
  version: number;

  /** 资料可见性: public/followers/private */
  @Column({ type: 'varchar', length: 20, default: 'public', name: 'privacy_profile' })
  privacyProfile: string;

  /** 动态可见性 */
  @Column({ type: 'varchar', length: 20, default: 'public', name: 'privacy_dynamic' })
  privacyDynamic: string;

  /** 角色: user/admin */
  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string;

  /** 状态: active/banned */
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // --- 关系 ---

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  @OneToMany(() => GalleryPhoto, (photo) => photo.user)
  galleryPhotos: GalleryPhoto[];

  @OneToMany(() => Event, (event) => event.creator)
  events: Event[];

  @OneToMany(() => EventSignup, (signup) => signup.user)
  eventSignups: EventSignup[];

  @OneToMany(() => PointsTransaction, (tx) => tx.user)
  pointsTransactions: PointsTransaction[];

  @OneToMany(() => AdminLog, (log) => log.admin)
  adminLogs: AdminLog[];

  @OneToMany(() => FitsAsset, (asset) => asset.user)
  fitsAssets: FitsAsset[];

  @OneToMany(() => DeviceUpload, (upload) => upload.user)
  deviceUploads: DeviceUpload[];
}
