import { Module } from '@nestjs/common';
import configuration from './configuration';

// 应用配置模块
@Module({
  providers: [
    {
      provide: 'CONFIGURATION',
      useFactory: () => configuration(),
    },
  ],
  exports: ['CONFIGURATION'],
})
export class ConfigModule {}
