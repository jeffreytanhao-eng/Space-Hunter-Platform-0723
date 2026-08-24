import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from '../../database/entities/follow.entity';
import { User } from '../../database/entities/user.entity';
import { Post } from '../../database/entities/post.entity';
import { GalleryPhoto } from '../../database/entities/gallery-photo.entity';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';
import { FollowFeedController } from './feed.controller';
import { FollowFeedService } from './feed.service';
import { NotificationsModule } from '../notifications/notifications.module';

// 关注模块
@Module({
  imports: [
    TypeOrmModule.forFeature([Follow, User, Post, GalleryPhoto]),
    NotificationsModule,
  ],
  controllers: [FollowsController, FollowFeedController],
  providers: [FollowsService, FollowFeedService],
  exports: [FollowsService],
})
export class FollowsModule {}
