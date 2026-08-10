import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsTransaction } from '../../database/entities/points-transaction.entity';
import { User } from '../../database/entities/user.entity';
import { CheckIn } from '../../database/entities/check-in.entity';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';

// 积分模块
@Module({
  imports: [TypeOrmModule.forFeature([PointsTransaction, User, CheckIn])],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
