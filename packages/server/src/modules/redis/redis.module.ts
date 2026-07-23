import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

// 全局 Redis 模块，提供 Redis 服务供所有模块使用
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
