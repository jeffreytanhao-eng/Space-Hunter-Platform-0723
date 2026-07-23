import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/** 发表评论 DTO */
export class CreateCommentDto {
  @ApiProperty({ description: '评论内容', example: '拍得真棒！' })
  @IsString()
  content: string;
}
