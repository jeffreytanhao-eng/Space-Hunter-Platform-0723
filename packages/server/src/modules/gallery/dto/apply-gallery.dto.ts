import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

/** 申请进入画廊 DTO */
export class ApplyGalleryDto {
  @ApiPropertyOptional({ description: '关联帖子 ID' })
  @IsOptional()
  @IsString()
  postId?: string;

  @ApiPropertyOptional({ description: '图片 URL（无关联帖子时直接提供）' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: '照片标题' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: '照片描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '分类' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}
