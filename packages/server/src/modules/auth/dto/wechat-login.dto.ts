import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 微信登录 DTO
export class WechatLoginDto {
  @ApiProperty({ description: '微信授权码', example: '0a1b2c3d' })
  @IsString()
  code: string;

  @ApiProperty({ description: '登录类型', enum: ['web', 'miniapp'], example: 'miniapp' })
  @IsString()
  @IsIn(['web', 'miniapp'])
  type: 'web' | 'miniapp';
}
