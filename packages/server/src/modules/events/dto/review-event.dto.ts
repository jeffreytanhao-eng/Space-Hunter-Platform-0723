import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

/** 活动审核 DTO */
export class ReviewEventDto {
  @ApiProperty({ description: '审核状态', enum: ['approved', 'rejected'] })
  @IsString()
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: '拒绝原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}
