import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './favorite.entity';
import { Post } from '../../database/entities/post.entity';
import { GalleryPhoto } from '../../database/entities/gallery-photo.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

// 收藏模块
@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Post, GalleryPhoto])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
