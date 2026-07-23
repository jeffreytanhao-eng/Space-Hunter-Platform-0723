import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** 积分明细查询 DTO */
export class QueryTransactionsDto {
  @ApiPropertyOptional({ description: '类型筛选: earn/spend' })
  @IsOptional()
  @IsString()
  @IsIn(['earn', 'spend'])
  type?: string;

  @ApiPropertyOptional({ description: '来源筛选', example: 'post_create' })
  @IsOptional()
  @IsString()
  source?: string;

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
