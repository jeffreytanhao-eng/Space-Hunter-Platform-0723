import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('广告')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  /** 获取启用的广告（公开接口，首页侧边栏使用） */
  @Get()
  @ApiOperation({ summary: '获取启用的广告列表（公开）' })
  async getActiveAds() {
    return this.adsService.getActiveAds();
  }

  /** 获取全部广告（管理后台使用，需要管理员权限） */
  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取全部广告列表（管理员）' })
  async getAllAds(@CurrentUser('role') role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可访问');
    }
    return this.adsService.getAllAds();
  }

  /** 创建广告（管理员） */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建广告' })
  async create(@CurrentUser('role') role: string, @Body() dto: CreateAdDto) {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可访问');
    }
    return this.adsService.create(dto);
  }

  /** 更新广告（管理员） */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新广告' })
  async update(
    @CurrentUser('role') role: string,
    @Param('id') id: string,
    @Body() dto: UpdateAdDto,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可访问');
    }
    return this.adsService.update(id, dto);
  }

  /** 删除广告（管理员） */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除广告' })
  async delete(@CurrentUser('role') role: string, @Param('id') id: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可访问');
    }
    await this.adsService.delete(id);
    return { message: '删除成功' };
  }

  /** 重置为默认广告（管理员） */
  @Post('reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '重置为默认广告' })
  async reset(@CurrentUser('role') role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可访问');
    }
    await this.adsService.reset();
    return { message: '重置成功' };
  }
}
