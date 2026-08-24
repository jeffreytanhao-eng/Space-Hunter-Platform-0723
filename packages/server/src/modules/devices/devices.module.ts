import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../../database/entities/device.entity';
import { DeviceUpload } from '../../database/entities/device-upload.entity';
import { DeviceProcessingTask } from '../../database/entities/device-processing-task.entity';
import { PointsModule } from '../points/points.module';
import { DevicesService } from './devices.service';
import { DevicesController, DeviceDeviceController, ProcessingCallbackController } from './devices.controller';
import { DeviceTokenGuard } from './device-token.guard';
import { DeviceWorkerService } from './device-worker.service';

/**
 * 设备模块（Task D1–D4）
 * 设计来源：设备模块 Phase0 补充规格 v1.0
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Device, DeviceUpload, DeviceProcessingTask]),
    PointsModule,
  ],
  controllers: [DevicesController, DeviceDeviceController, ProcessingCallbackController],
  providers: [DevicesService, DeviceTokenGuard, DeviceWorkerService],
  exports: [DevicesService],
})
export class DevicesModule {}