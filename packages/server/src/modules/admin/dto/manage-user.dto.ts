import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/** 用户管理 DTO */
export class ManageUserDto {
  @ApiPropertyOptional({ description: '用户状态', enum: ['active', 'banned'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'banned'])
  status?: string;

  @ApiPropertyOptional({ description: '角色', enum: ['user', 'admin'] })
  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin'])
  role?: string;

  @ApiPropertyOptional({ description: '积分调整（正数加，负数减）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pointsAdjust?: number;
}
