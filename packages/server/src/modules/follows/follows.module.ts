import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from '../../database/entities/follow.entity';
import { User } from '../../database/entities/user.entity';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';

// 关注模块
@Module({
  imports: [TypeOrmModule.forFeature([Follow, User])],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
