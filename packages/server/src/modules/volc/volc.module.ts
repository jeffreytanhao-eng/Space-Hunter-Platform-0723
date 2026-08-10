import { Module } from '@nestjs/common';
import { VolcController } from './volc.controller';
import { VolcService } from './volc.service';

// 火山引擎 MediaKit 测试模块（隐藏，仅管理员）
@Module({
  controllers: [VolcController],
  providers: [VolcService],
  exports: [VolcService],
})
export class VolcModule {}