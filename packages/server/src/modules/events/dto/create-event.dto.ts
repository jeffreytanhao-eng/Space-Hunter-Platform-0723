import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsIn, IsInt, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** 创建活动 DTO */
export class CreateEventDto {
  @ApiProperty({ description: '活动标题' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '活动描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '开始时间', example: '2026-08-01T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ description: '结束时间', example: '2026-08-01T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({ description: '地点类型', enum: ['online', 'offline'] })
  @IsString()
  @IsIn(['online', 'offline'])
  locationType: string;

  @ApiPropertyOptional({ description: '地点' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  location?: string;

  @ApiPropertyOptional({ description: '最大参与人数' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxParticipants?: number;
}
