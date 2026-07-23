import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('关注')
@Controller('users')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':userId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '关注用户' })
  @ApiParam({ name: 'userId', description: '被关注用户 ID' })
  async follow(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.followsService.follow(followerId, followingId);
  }

  @Delete(':userId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消关注' })
  @ApiParam({ name: 'userId', description: '被关注用户 ID' })
  async unfollow(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    await this.followsService.unfollow(followerId, followingId);
    return { success: true };
  }

  @Get(':userId/followers')
  @ApiOperation({ summary: '获取粉丝列表' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.followsService.getFollowers(userId, page, pageSize);
  }

  @Get(':userId/following')
  @ApiOperation({ summary: '获取关注列表' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.followsService.getFollowing(userId, page, pageSize);
  }

  @Get(':userId/follow-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询关注状态（是否已关注）' })
  @ApiParam({ name: 'userId', description: '被关注用户 ID' })
  async isFollowing(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.followsService.isFollowing(followerId, followingId);
  }
}
