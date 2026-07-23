import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FitsAsset } from '../../database/entities/fits-asset.entity';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CosModule } from './cos.module';

// 上传模块
@Module({
  imports: [
    TypeOrmModule.forFeature([FitsAsset]),
    CosModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
