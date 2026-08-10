import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('帖子')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: '帖子列表（分页、筛选、搜索、排序）' })
  async findAll(
    @Query() query: QueryPostDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // ADR-008: 缓存策略 max-age=30, s-maxage=60
    res.set('Cache-Control', 'public, max-age=30, s-maxage=60');

    const user = req.user as any;
    const userRole = user?.role;
    return this.postsService.findAll(query, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: '帖子详情（含评论列表）' })
  @ApiParam({ name: 'id', description: '帖子 ID' })
  async findById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发帖' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(userId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '编辑帖子（仅作者）' })
  @ApiParam({ name: 'id', description: '帖子 ID' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(userId, postId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除帖子（仅作者或管理员）' })
  @ApiParam({ name: 'id', description: '帖子 ID' })
  async remove(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('id') postId: string,
  ) {
    return this.postsService.remove(userId, postId, userRole);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞/取消点赞（切换）' })
  @ApiParam({ name: 'id', description: '帖子 ID' })
  async toggleLike(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
  ) {
    return this.postsService.toggleLike(userId, postId);
  }

  @Get(':id/fits-status')
  @ApiOperation({ summary: '查询 FITS 处理状态' })
  @ApiParam({ name: 'id', description: '帖子 ID' })
  async getFitsStatus(@Param('id') postId: string) {
    return this.postsService.getFitsStatus(postId);
  }
}
