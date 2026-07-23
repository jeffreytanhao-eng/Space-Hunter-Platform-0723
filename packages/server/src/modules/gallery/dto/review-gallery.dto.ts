import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

/** 画廊审核 DTO */
export class ReviewGalleryDto {
  @ApiProperty({ description: '审核状态', enum: ['approved', 'rejected'] })
  @IsString()
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: '拒绝原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}
