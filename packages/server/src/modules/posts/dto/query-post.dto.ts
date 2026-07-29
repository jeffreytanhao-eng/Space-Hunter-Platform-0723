import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsInt, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** 帖子列表查询 DTO */
export class QueryPostDto {
  @ApiPropertyOptional({ description: '板块 ID' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ description: '标签筛选(数组)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '单个标签筛选(便捷参数)' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: '关键词搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;

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

  @ApiPropertyOptional({ description: '排序字段', enum: ['created_at', 'like_count', 'comment_count'], default: 'created_at' })
  @IsOptional()
  @IsString()
  @IsIn(['created_at', 'like_count', 'comment_count'])
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
