import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageProcessJob } from '../../database/entities/image-process-job.entity';
import { ImageProcessController } from './image-process.controller';
import { ImageProcessService } from './image-process.service';

@Module({
  imports: [TypeOrmModule.forFeature([ImageProcessJob])],
  controllers: [ImageProcessController],
  providers: [ImageProcessService],
  exports: [ImageProcessService],
})
export class ImageProcessModule {}
