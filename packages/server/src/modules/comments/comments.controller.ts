import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('评论')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('posts/:postId/comments')
  @ApiOperation({ summary: '获取帖子评论列表（分页）' })
  @ApiParam({ name: 'postId', description: '帖子 ID' })
  async findByPost(
    @Param('postId') postId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.commentsService.findByPost(
      postId,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发表评论' })
  @ApiParam({ name: 'postId', description: '帖子 ID' })
  async create(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(userId, postId, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除评论（仅作者或管理员）' })
  @ApiParam({ name: 'id', description: '评论 ID' })
  async remove(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('id') commentId: string,
  ) {
    return this.commentsService.remove(userId, commentId, userRole);
  }
}
