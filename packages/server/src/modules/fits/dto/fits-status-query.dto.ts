import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** FITS 状态查询 DTO */
export class FitsStatusQueryDto {
  @ApiPropertyOptional({ description: '异步处理任务 ID（可选，用于精确查询）' })
  @IsOptional()
  @IsString()
  jobId?: string;
}
