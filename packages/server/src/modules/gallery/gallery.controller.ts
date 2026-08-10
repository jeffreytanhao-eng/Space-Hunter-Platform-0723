import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { GalleryService } from './gallery.service';
import { ApplyGalleryDto } from './dto/apply-gallery.dto';
import { ReviewGalleryDto } from './dto/review-gallery.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('画廊')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  @ApiOperation({ summary: '画廊列表（分页、分类、排序、搜索）' })
  async findAll(
    @Query() query: QueryGalleryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 缓存策略
    res.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    return this.galleryService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '画廊详情（含 FITS 元数据 + 原始文件下载链接）' })
  @ApiParam({ name: 'id', description: '画廊照片 ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.galleryService.findById(id, userId);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '申请进入画廊' })
  async apply(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyGalleryDto,
  ) {
    return this.galleryService.apply(userId, dto);
  }

  @Put(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '管理员审核画廊（通过/拒绝）' })
  @ApiParam({ name: 'id', description: '画廊照片 ID' })
  async review(
    @CurrentUser('id') adminId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
    @Body() dto: ReviewGalleryDto,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可执行此操作');
    }
    return this.galleryService.review(adminId, id, dto);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '下载原始文件' })
  @ApiParam({ name: 'id', description: '画廊照片 ID' })
  async downloadOriginal(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.galleryService.downloadOriginal(id, userId);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '画廊点赞切换' })
  @ApiParam({ name: 'id', description: '画廊照片 ID' })
  async toggleLike(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.galleryService.toggleLike(userId, id);
  }
}
