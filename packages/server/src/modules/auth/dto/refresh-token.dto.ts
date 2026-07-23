import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 刷新 Token DTO
export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌', example: 'eyJhbGciOiJIUzI1NiIs...' })
  @IsString()
  refreshToken: string;
}
