import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** 设置/修改密码 DTO */
export class UpdatePasswordDto {
  @ApiProperty({ description: '新密码（6-64位）', example: 'myPassword123' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  newPassword: string;

  @ApiProperty({ description: '旧密码（已设密码的用户必填，首次设置密码时留空）', example: 'oldPassword123', required: false })
  @IsString()
  @MaxLength(64)
  oldPassword?: string;
}
