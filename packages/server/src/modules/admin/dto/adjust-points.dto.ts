import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

/** 积分调整 DTO */
export class AdjustPointsDto {
  @ApiProperty({ description: '用户 ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: '调整数量（正数加，负数减）' })
  @Type(() => Number)
  @IsInt()
  amount: number;

  @ApiProperty({ description: '调整说明', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  description: string;
}
