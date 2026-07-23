import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsIn, MaxLength } from 'class-validator';

/** 管理员更新板块 DTO */
export class UpdateSectionDto {
  @ApiPropertyOptional({ description: '板块名称' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({ description: '板块描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '板块图标 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  icon?: string;

  @ApiPropertyOptional({ description: '排序权重' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '状态', enum: ['approved', 'disabled'] })
  @IsOptional()
  @IsString()
  @IsIn(['approved', 'disabled'])
  status?: string;
}
