import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

/** 用户申请新板块 DTO */
export class CreateSectionDto {
  @ApiProperty({ description: '板块名称', example: '深空摄影' })
  @IsString()
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional({ description: '板块描述', example: '分享深空天体摄影作品' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '板块图标 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  icon?: string;
}
