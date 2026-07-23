import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/** 图片项 */
export class ImageItemDto {
  @ApiProperty({ description: '图片 URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: '类型: image/fits', example: 'image' })
  @IsString()
  type: 'image' | 'fits';

  @ApiPropertyOptional({ description: 'FITS 处理任务 ID' })
  @IsOptional()
  @IsString()
  jobId?: string;
}

/** 创建帖子 DTO */
export class CreatePostDto {
  @ApiProperty({ description: '板块 ID' })
  @IsString()
  sectionId: string;

  @ApiProperty({ description: '帖子标题', example: '仙女座星系 M31 深空摄影' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '帖子内容' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '图片列表', type: [ImageItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageItemDto)
  images?: ImageItemDto[];

  @ApiPropertyOptional({ description: '标签', example: ['深空', 'M31'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
