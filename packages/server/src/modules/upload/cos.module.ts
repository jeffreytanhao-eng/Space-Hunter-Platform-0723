import { Global, Module } from '@nestjs/common';
import { CosService } from './cos.service';

// COS 服务模块，全局可用
@Global()
@Module({
  providers: [CosService],
  exports: [CosService],
})
export class CosModule {}
