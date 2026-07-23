import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FitsAsset } from '../../database/entities/fits-asset.entity';
import { Post } from '../../database/entities/post.entity';
import { FitsController } from './fits.controller';
import { FitsService } from './fits.service';
import { CosModule } from '../upload/cos.module';

// FITS处理模块
@Module({
  imports: [
    TypeOrmModule.forFeature([FitsAsset, Post]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-secret'),
      }),
    }),
    CosModule,
  ],
  controllers: [FitsController],
  providers: [FitsService],
  exports: [FitsService],
})
export class FitsModule {}
