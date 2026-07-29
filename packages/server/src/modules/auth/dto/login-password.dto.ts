import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** 用户名/密码登录 DTO（管理员用） */
export class LoginPasswordDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  @Length(2, 64)
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @Length(6, 64)
  password: string;
}
