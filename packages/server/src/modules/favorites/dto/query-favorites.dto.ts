import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** 收藏列表查询 DTO */
export class QueryFavoritesDto {
  @ApiPropertyOptional({ description: '收藏对象类型: post/gallery' })
  @IsOptional()
  @IsString()
  @IsIn(['post', 'gallery'])
  targetType?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
