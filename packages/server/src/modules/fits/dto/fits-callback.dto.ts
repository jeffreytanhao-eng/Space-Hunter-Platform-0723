import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsObject, IsBoolean, IsNumber } from 'class-validator';

/** FITS Worker 回调 DTO */
export class FitsCallbackDto {
  @ApiProperty({ description: '异步处理任务 ID' })
  @IsString()
  jobId: string;

  @ApiProperty({ description: '处理状态', enum: ['ready', 'failed'] })
  @IsIn(['ready', 'failed'])
  status: 'ready' | 'failed';

  @ApiPropertyOptional({ description: '预览图 URL' })
  @IsOptional()
  @IsString()
  previewUrl?: string;

  @ApiPropertyOptional({ description: '预览图大小 (bytes)' })
  @IsOptional()
  @IsNumber()
  previewSize?: number;

  @ApiPropertyOptional({ description: 'FITS 元数据' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: '错误信息' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({ description: '是否可重试' })
  @IsOptional()
  @IsBoolean()
  retryable?: boolean;
}
