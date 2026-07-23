import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

/** 帖子审核 DTO */
export class ReviewPostDto {
  @ApiProperty({ description: '审核状态', enum: ['published', 'rejected'] })
  @IsString()
  @IsIn(['published', 'rejected'])
  status: 'published' | 'rejected';

  @ApiPropertyOptional({ description: '拒绝原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}
