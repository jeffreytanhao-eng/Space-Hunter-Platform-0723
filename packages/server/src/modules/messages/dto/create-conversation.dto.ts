import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/** 建立会话 DTO */
export class CreateConversationDto {
  @ApiProperty({ description: '对方用户 ID', example: '2' })
  @IsString()
  peerId: string;
}
