import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  Headers,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DevicesService } from './devices.service';
import { DeviceTokenGuard } from './device-token.guard';
import { CurrentDevice } from './current-device.decorator';
import { BindDeviceDto, DeviceUploadBodyDto, ProcessingCallbackDto } from './dto/devices.dto';
import { ConfigService } from '@nestjs/config';

/** 用户侧设备管理接口（Task D2/D3） */
@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly configService: ConfigService,
  ) {}

  @Post('bind')
  bind(@CurrentUser('id') userId: string, @Body() dto: BindDeviceDto) {
    return this.devicesService.bind(userId, dto);
  }

  @Post('unbind')
  unbind(@CurrentUser('id') userId: string) {
    return this.devicesService.unbind(userId);
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.devicesService.me(userId);
  }

  @Get('uploads')
  uploads(
    @CurrentUser('id') userId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.devicesService.getUserUploads(userId, +page, +pageSize);
  }

  @Get('uploads/:id/tasks')
  uploadTasks(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.devicesService.getUploadTasks(id, { userId });
  }
}

/** 设备端接口（设备令牌鉴权，Task D3） */
@Controller('devices')
@UseGuards(DeviceTokenGuard)
export class DeviceDeviceController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentDevice() device: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: DeviceUploadBodyDto,
  ) {
    return this.devicesService.upload(device, file, body);
  }

  @Get('uploads')
  uploads(
    @CurrentDevice() device: any,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.devicesService.getDeviceUploads(device, +page, +pageSize);
  }
}

/** 处理结果回调接口（内部令牌鉴权，Task D4） */
@Controller('internal/processing')
export class ProcessingCallbackController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly configService: ConfigService,
  ) {}

  @Post('callback')
  callback(
    @Headers('x-internal-token') token: string,
    @Body() dto: ProcessingCallbackDto,
  ) {
    const expected = this.configService.get<string>('DEVICE_INTERNAL_TOKEN', '');
    if (!expected || token !== expected) {
      throw new UnauthorizedException('内部令牌无效');
    }
    return this.devicesService.completeProcessing(dto);
  }
}