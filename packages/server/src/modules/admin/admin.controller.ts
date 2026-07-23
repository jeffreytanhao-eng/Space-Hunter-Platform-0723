import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { GalleryService } from '../gallery/gallery.service';
import { EventsService } from '../events/events.service';
import { ReviewPostDto } from './dto/review-post.dto';
import { ReviewGalleryDto } from '../gallery/dto/review-gallery.dto';
import { ReviewEventDto } from '../events/dto/review-event.dto';
import { ManageUserDto } from './dto/manage-user.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { AdminQueryDto } from './dto/admin-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('管理后台')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly galleryService: GalleryService,
    private readonly eventsService: EventsService,
  ) {}

  /** 管理员权限校验 */
  private checkAdmin(role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可访问');
    }
  }

  @Get('stats')
  @ApiOperation({ summary: '数据统计看板' })
  async getStats(@CurrentUser('role') role: string) {
    this.checkAdmin(role);
    return this.adminService.getStats();
  }

  @Get('posts/pending')
  @ApiOperation({ summary: '待审核帖子列表' })
  async getPendingPosts(
    @CurrentUser('role') role: string,
    @Query() query: AdminQueryDto,
  ) {
    this.checkAdmin(role);
    return this.adminService.getPendingPosts(query);
  }

  @Put('posts/:id/review')
  @ApiOperation({ summary: '审核帖子' })
  @ApiParam({ name: 'id', description: '帖子 ID' })
  async reviewPost(
    @CurrentUser('id') adminId: string,
    @CurrentUser('role') role: string,
    @Param('id') postId: string,
    @Body() dto: ReviewPostDto,
  ) {
    this.checkAdmin(role);
    return this.adminService.reviewPost(adminId, postId, dto);
  }

  @Get('gallery/pending')
  @ApiOperation({ summary: '待审核画廊列表' })
  async getPendingGallery(
    @CurrentUser('role') role: string,
    @Query() query: AdminQueryDto,
  ) {
    this.checkAdmin(role);
    return this.adminService.getPendingGallery(query);
  }

  @Put('gallery/:id/review')
  @ApiOperation({ summary: '审核画廊' })
  @ApiParam({ name: 'id', description: '画廊照片 ID' })
  async reviewGallery(
    @CurrentUser('id') adminId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
    @Body() dto: ReviewGalleryDto,
  ) {
    this.checkAdmin(role);
    return this.galleryService.review(adminId, id, dto);
  }

  @Get('events/pending')
  @ApiOperation({ summary: '待审核活动列表' })
  async getPendingEvents(
    @CurrentUser('role') role: string,
    @Query() query: AdminQueryDto,
  ) {
    this.checkAdmin(role);
    return this.adminService.getPendingEvents(query);
  }

  @Put('events/:id/review')
  @ApiOperation({ summary: '审核活动' })
  @ApiParam({ name: 'id', description: '活动 ID' })
  async reviewEvent(
    @CurrentUser('id') adminId: string,
    @CurrentUser('role') role: string,
    @Param('id') eventId: string,
    @Body() dto: ReviewEventDto,
  ) {
    this.checkAdmin(role);
    return this.eventsService.review(adminId, eventId, dto);
  }

  @Get('sections/pending')
  @ApiOperation({ summary: '待审核板块列表' })
  async getPendingSections(
    @CurrentUser('role') role: string,
    @Query() query: AdminQueryDto,
  ) {
    this.checkAdmin(role);
    return this.adminService.getPendingSections(query);
  }

  @Put('sections/:id')
  @ApiOperation({ summary: '管理板块（启用/禁用/排序）' })
  @ApiParam({ name: 'id', description: '板块 ID' })
  async manageSection(
    @CurrentUser('id') adminId: string,
    @CurrentUser('role') role: string,
    @Param('id') sectionId: string,
    @Body() dto: { status?: string; sortOrder?: number },
  ) {
    this.checkAdmin(role);
    return this.adminService.manageSection(adminId, sectionId, dto);
  }

  @Get('users')
  @ApiOperation({ summary: '用户管理列表' })
  async getUsers(
    @CurrentUser('role') role: string,
    @Query() query: AdminQueryDto,
  ) {
    this.checkAdmin(role);
    return this.adminService.getUsers(query);
  }

  @Put('users/:id')
  @ApiOperation({ summary: '用户管理（封禁/解封/积分调整/角色）' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  async manageUser(
    @CurrentUser('id') adminId: string,
    @CurrentUser('role') role: string,
    @Param('id') userId: string,
    @Body() dto: ManageUserDto,
  ) {
    this.checkAdmin(role);
    return this.adminService.manageUser(adminId, userId, dto);
  }

  @Get('points/transactions')
  @ApiOperation({ summary: '积分交易流水' })
  async getPointsTransactions(
    @CurrentUser('role') role: string,
    @Query() query: AdminQueryDto,
  ) {
    this.checkAdmin(role);
    return this.adminService.getPointsTransactions(query);
  }

  @Post('points/adjust')
  @ApiOperation({ summary: '积分调整' })
  async adjustPoints(
    @CurrentUser('id') adminId: string,
    @CurrentUser('role') role: string,
    @Body() dto: AdjustPointsDto,
  ) {
    this.checkAdmin(role);
    return this.adminService.adjustPoints(adminId, dto);
  }

  @Get('logs')
  @ApiOperation({ summary: '管理操作日志' })
  async getLogs(
    @CurrentUser('role') role: string,
    @Query() query: AdminQueryDto,
  ) {
    this.checkAdmin(role);
    return this.adminService.getLogs(query);
  }
}
