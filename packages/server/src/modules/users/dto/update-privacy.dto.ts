import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 更新隐私设置 DTO
export class UpdatePrivacyDto {
  @ApiProperty({ description: '资料可见性', example: 'public', enum: ['public', 'followers', 'private'] })
  @IsString()
  @IsIn(['public', 'followers', 'private'])
  profileVisibility: string;

  @ApiProperty({ description: '动态可见性', example: 'public', enum: ['public', 'followers', 'private'] })
  @IsString()
  @IsIn(['public', 'followers', 'private'])
  dynamicVisibility: string;
}
