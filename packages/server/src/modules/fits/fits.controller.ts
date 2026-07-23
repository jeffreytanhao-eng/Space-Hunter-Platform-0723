import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { FitsService } from './fits.service';
import { FitsCallbackDto } from './dto/fits-callback.dto';
import { FitsStatusQueryDto } from './dto/fits-status-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { verifyInternalToken } from '../../common/utils/internal-jwt';

@ApiTags('FITS')
@Controller()
export class FitsController {
  constructor(
    private readonly fitsService: FitsService,
    private readonly configService: ConfigService,
  ) {}

  @Get('posts/:postId/fits-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询 FITS 处理状态（前端轮询）' })
  @ApiParam({ name: 'postId', description: '帖子 ID' })
  async getFitsStatus(
    @Param('postId') postId: string,
    @Query() query: FitsStatusQueryDto,
  ) {
    return this.fitsService.getFitsStatus(postId, query.jobId);
  }

  @Get('posts/:postId/fits/original')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '原始文件下载（302 重定向到 COS 签名 URL）' })
  @ApiParam({ name: 'postId', description: '帖子 ID' })
  async downloadOriginal(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const { url } = await this.fitsService.downloadOriginal(postId, userId);
    // 302 重定向到 COS 签名 URL
    return res.redirect(302, url);
  }

  @Post('internal/fits/callback')
  @ApiOperation({ summary: 'Worker 回调接口（仅内网调用）' })
  @ApiHeader({ name: 'X-Internal-Token', description: '内部服务 JWT' })
  async handleCallback(
    @Body() dto: FitsCallbackDto,
    @Headers('x-internal-token') token: string,
  ) {
    // 校验内部 JWT
    if (!token) {
      throw new UnauthorizedException('缺少内部认证令牌');
    }

    try {
      verifyInternalToken(token, this.configService);
    } catch {
      throw new UnauthorizedException('内部认证令牌无效');
    }

    await this.fitsService.handleCallback(dto);
    return { success: true };
  }
}
