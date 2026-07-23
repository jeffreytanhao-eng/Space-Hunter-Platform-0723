import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../../database/entities/post.entity';
import { Comment } from '../../database/entities/comment.entity';
import { FitsAsset } from '../../database/entities/fits-asset.entity';
import { PointsTransaction } from '../../database/entities/points-transaction.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { SectionsModule } from '../sections/sections.module';

// 帖子模块
@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Comment, FitsAsset, PointsTransaction]),
    SectionsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
