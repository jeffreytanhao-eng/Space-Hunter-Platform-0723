import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/** 积分兑换 DTO */
export class RedeemDto {
  @ApiProperty({ description: '奖励 ID', example: 'badge_stargazer' })
  @IsString()
  rewardId: string;

  @ApiProperty({ description: '幂等键，防止重复兑换' })
  @IsString()
  idempotencyKey: string;
}
