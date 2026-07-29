import { IsString, IsOptional, IsArray, MaxLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// 更新个人资料 DTO
export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称', example: '星空探索者' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @ApiPropertyOptional({ description: '用户名（字母数字下划线，2-32位）', example: 'stargazer_2024' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]{2,32}$/, {
    message: '用户名只能包含中文、字母、数字和下划线',
  })
  username?: string;

  @ApiPropertyOptional({ description: '头像 URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatar?: string;

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
