import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/** 发送消息 DTO */
export class CreateMessageDto {
  @ApiProperty({ description: '消息内容', example: '你好' })
  @IsString()
  content: string;
}
