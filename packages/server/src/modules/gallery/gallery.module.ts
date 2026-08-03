import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryPhoto } from '../../database/entities/gallery-photo.entity';
import { Post } from '../../database/entities/post.entity';
import { AdminLog } from '../../database/entities/admin-log.entity';
import { FitsAsset } from '../../database/entities/fits-asset.entity';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { PointsModule } from '../points/points.module';
import { ModerationModule } from '../../common/moderation/moderation.module';

// 画廊模块
@Module({
  imports: [
    TypeOrmModule.forFeature([GalleryPhoto, Post, AdminLog, FitsAsset]),
    PointsModule,
    ModerationModule,
  ],
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
