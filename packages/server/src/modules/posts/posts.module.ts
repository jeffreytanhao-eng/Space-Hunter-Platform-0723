import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../../database/entities/post.entity';
import { Comment } from '../../database/entities/comment.entity';
import { FitsAsset } from '../../database/entities/fits-asset.entity';
import { PointsTransaction } from '../../database/entities/points-transaction.entity';
import { Favorite } from '../favorites/favorite.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { SectionsModule } from '../sections/sections.module';
import { ModerationModule } from '../../common/moderation';
import { NotificationsModule } from '../notifications/notifications.module';

// 帖子模块
@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Comment, FitsAsset, PointsTransaction, Favorite]),
    SectionsModule,
    ModerationModule,
    NotificationsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
