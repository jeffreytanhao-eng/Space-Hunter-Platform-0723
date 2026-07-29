import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 广告实体
 * 统一广告格式：图片 + 标题 + 简介 + 可选链接 + 可选地址
 */
@Entity('ads')
export class Ad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 标题（必填） */
  @Column({ type: 'varchar', length: 128 })
  title: string;

  /** 简要介绍（必填，数据库列名用 description 避免 desc 保留字） */
  @Column({ type: 'varchar', length: 256, name: 'description' })
  desc: string;

  /** 图片 URL（必填，由 /upload 返回） */
  @Column({ type: 'varchar', length: 512 })
  img: string;

  /** 点击图片跳转链接（可选） */
  @Column({ type: 'varchar', length: 512, nullable: true })
  href: string | null;

  /** 地址信息（可选） */
  @Column({ type: 'varchar', length: 256, nullable: true })
  address: string | null;

  /** 经度（可选，有地址时可附带精确坐标） */
  @Column({ type: 'double precision', nullable: true })
  lng: number | null;

  /** 纬度（可选） */
  @Column({ type: 'double precision', nullable: true })
  lat: number | null;

  /** 是否启用 */
  @Column({ type: 'boolean', default: true })
  active: boolean;

  /** 排序权重（越小越靠前） */
  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
