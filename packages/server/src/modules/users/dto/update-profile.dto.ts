import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// 更新个人资料 DTO
export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称', example: '星空探索者' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @ApiPropertyOptional({ description: '个人简介', example: '热爱星空的观测者' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: '天文兴趣标签', example: ['深空', '行星'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: '设备信息', example: 'Celestron C8' })
  @IsOptional()
  @IsString()
  equipment?: string;
}
