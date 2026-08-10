import {
  Controller,
  Get,
  Post,
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
import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('私信')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: '我的会话列表（含对方信息、最后一条消息、未读数）' })
  async getConversations(@CurrentUser('id') userId: string) {
    return this.messagesService.getConversations(userId);
  }

  @Post('conversations')
  @ApiOperation({ summary: '建立/复用与某用户的一对一会话' })
  async createConversation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.messagesService.createConversation(userId, dto);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: '会话消息列表（按时间升序，并标记已读）' })
  @ApiParam({ name: 'id', description: '会话 ID' })
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Query() query: QueryMessagesDto,
  ) {
    return this.messagesService.getMessages(userId, conversationId, query);
  }

  @Post('conversations/:id')
  @ApiOperation({ summary: '发送消息' })
  @ApiParam({ name: 'id', description: '会话 ID' })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.sendMessage(userId, conversationId, dto);
  }
}
