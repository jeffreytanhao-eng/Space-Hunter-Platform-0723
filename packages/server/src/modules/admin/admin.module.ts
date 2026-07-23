import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { Post } from '../../database/entities/post.entity';
import { GalleryPhoto } from '../../database/entities/gallery-photo.entity';
import { Event } from '../../database/entities/event.entity';
import { Section } from '../../database/entities/section.entity';
import { AdminLog } from '../../database/entities/admin-log.entity';
import { PointsTransaction } from '../../database/entities/points-transaction.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PointsModule } from '../points/points.module';
import { GalleryModule } from '../gallery/gallery.module';
import { EventsModule } from '../events/events.module';

// 管理模块
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post, GalleryPhoto, Event, Section, AdminLog, PointsTransaction]),
    PointsModule,
    GalleryModule,
    EventsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
