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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ReviewEventDto } from './dto/review-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('活动')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '活动列表（仅已审核）' })
  async findAll(
    @Query() query: QueryEventDto,
    @CurrentUser('id') userId: string | undefined,
  ) {
    return this.eventsService.findAll(query, userId);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '我的活动列表' })
  async getMyEvents(
    @CurrentUser('id') userId: string,
    @Query() query: QueryEventDto,
  ) {
    return this.eventsService.getMyEvents(userId, query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '活动详情' })
  @ApiParam({ name: 'id', description: '活动 ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string | undefined,
  ) {
    return this.eventsService.findById(id, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建活动（需审核）' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(userId, dto);
  }

  @Post(':id/signup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '报名活动' })
  @ApiParam({ name: 'id', description: '活动 ID' })
  async signup(
    @CurrentUser('id') userId: string,
    @Param('id') eventId: string,
  ) {
    return this.eventsService.signup(userId, eventId);
  }

  @Delete(':id/signup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消报名' })
  @ApiParam({ name: 'id', description: '活动 ID' })
  async cancelSignup(
    @CurrentUser('id') userId: string,
    @Param('id') eventId: string,
  ) {
    await this.eventsService.cancelSignup(userId, eventId);
    return { success: true };
  }

  @Put(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '管理员审核活动' })
  @ApiParam({ name: 'id', description: '活动 ID' })
  async review(
    @CurrentUser('id') adminId: string,
    @CurrentUser('role') role: string,
    @Param('id') eventId: string,
    @Body() dto: ReviewEventDto,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可执行此操作');
    }
    return this.eventsService.review(adminId, eventId, dto);
  }

  @Post('official')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '官方发布活动' })
  async createOfficial(
    @CurrentUser('id') adminId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreateEventDto,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可发布官方活动');
    }
    return this.eventsService.createOfficial(adminId, dto);
  }
}
