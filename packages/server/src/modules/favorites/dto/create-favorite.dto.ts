import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

/** 收藏请求 DTO */
export class CreateFavoriteDto {
  @ApiProperty({ description: '收藏对象类型: post/gallery', example: 'post' })
  @IsString()
  @IsIn(['post', 'gallery'])
  targetType: string;

  @ApiProperty({ description: '收藏对象 ID', example: '1' })
  @IsString()
  targetId: string;
}
