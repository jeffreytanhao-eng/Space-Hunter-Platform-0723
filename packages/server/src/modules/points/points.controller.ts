import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PointsService } from './points.service';
import { RedeemDto } from './dto/redeem.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('积分')
@Controller('points')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  @ApiOperation({ summary: '查询当前用户积分余额' })
  async getBalance(@CurrentUser('id') userId: string) {
    return this.pointsService.getBalance(userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: '查询积分明细（分页）' })
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.pointsService.getTransactions(userId, query);
  }

  @Post('redeem')
  @ApiOperation({ summary: '积分兑换' })
  async redeem(
    @CurrentUser('id') userId: string,
    @Body() dto: RedeemDto,
  ) {
    return this.pointsService.redeem(userId, dto);
  }

  @Get('rewards')
  @ApiOperation({ summary: '获取可兑换奖励列表' })
  async getRewards() {
    return this.pointsService.getRewards();
  }
}
