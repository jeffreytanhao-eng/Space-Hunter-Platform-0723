/** 设备模块入参数定义（Task D2/D3） */
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

/** 绑定设备 */
export class BindDeviceDto {
  /** 硬件唯一标识 */
  @IsString()
  hardwareId!: string;
  /** 设备名称（可选） */
  @IsOptional()
  @IsString()
  name?: string;
}

/** 设备上传（multipart 表单附加字段） */
export class DeviceUploadBodyDto {
  /** fits/image/raw */
  @IsIn(['fits', 'image', 'raw'])
  fileType!: string;
  /** 附加元数据（可选 JSON 对象，如温度、曝光等） */
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
  /** 需要触发的处理类型，逗号分隔，如 fits_process,ai_enhance（缺省按文件类型推断） */
  @IsOptional()
  @IsString()
  types?: string;
}

/** 处理完成回调载荷 */
export class ProcessingCallbackDto {
  @IsString()
  uploadId!: string;
  @IsString()
  type!: string;
  @IsIn(['done', 'failed'])
  status!: 'done' | 'failed';
  @IsOptional()
  @IsObject()
  result?: Record<string, any>;
  @IsOptional()
  @IsString()
  error?: string;
}