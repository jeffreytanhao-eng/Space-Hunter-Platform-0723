import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ad } from './ad.entity';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ad])],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule implements OnModuleInit {
  constructor(private readonly adsService: AdsService) {}

  /** 模块初始化时种子默认广告 */
  async onModuleInit() {
    await this.adsService.seedDefaults();
  }
}
