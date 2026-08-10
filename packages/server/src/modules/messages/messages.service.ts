import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';
import { User } from '../../database/entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** 当前用户参与的会话列表（按最后消息时间倒序） */
  async getConversations(userId: string) {
    const conversations = await this.conversationRepo
      .createQueryBuilder('c')
      .where('c.user_a_id = :userId OR c.user_b_id = :userId', { userId })
      .orderBy('c.last_message_at', 'DESC')
      .getMany();

    const result = [];
    for (const convo of conversations) {
      const peerId = convo.userAId === userId ? convo.userBId : convo.userAId;
      const peer = await this.userRepo.findOne({
        where: { id: peerId },
        select: ['id', 'nickname', 'avatar'],
      });
      const lastMessage = await this.messageRepo.findOne({
        where: { conversationId: convo.id },
        order: { createdAt: 'DESC' },
      });
      const unreadCount = await this.messageRepo.count({
        where: { conversationId: convo.id, senderId: Not(userId), isRead: false },
      });
      result.push({
        ...convo,
        peer: peer || null,
        lastMessage,
        unreadCount,
      });
    }

    return result;
  }

  /** 建立/复用一对一会话 */
  async createConversation(userId: string, dto: CreateConversationDto): Promise<Conversation> {
    const peerId = dto.peerId;
    if (peerId === userId) {
      throw new BadRequestException('不能与自己创建会话');
    }

    // 校验对方用户存在
    const peer = await this.userRepo.findOne({ where: { id: peerId } });
    if (!peer) {
      throw new NotFoundException('对方用户不存在');
    }

    const existing = await this.findPair(userId, peerId);
    if (existing) {
      return existing;
    }

    const [userAId, userBId] = this.normalizePair(userId, peerId);
    const convo = this.conversationRepo.create({ userAId, userBId });
    return this.conversationRepo.save(convo);
  }

  /** 会话消息列表（按时间升序），并将发给当前用户的未读消息标记为已读 */
  async getMessages(
    userId: string,
    conversationId: string,
    query: QueryMessagesDto,
  ): Promise<PaginatedResult<Message>> {
    const convo = await this.ensureParticipant(conversationId, userId);

    const { page = 1, pageSize = 50 } = query;

    const [data, total] = await this.messageRepo.findAndCount({
      where: { conversationId: convo.id },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 将该会话中发送给当前用户且未读的消息标记为已读
    await this.messageRepo.update(
      { conversationId: convo.id, senderId: Not(userId), isRead: false },
      { isRead: true },
    );

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** 发送消息 */
  async sendMessage(
    userId: string,
    conversationId: string,
    dto: CreateMessageDto,
  ): Promise<Message> {
    const convo = await this.ensureParticipant(conversationId, userId);

    const message = this.messageRepo.create({
      conversationId: convo.id,
      senderId: userId,
      content: dto.content,
    });
    const saved = await this.messageRepo.save(message);

    // 更新会话最后消息时间
    convo.lastMessageAt = new Date();
    await this.conversationRepo.save(convo);

    return saved;
  }

  /** 确认当前用户是会话参与者 */
  private async ensureParticipant(conversationId: string, userId: string): Promise<Conversation> {
    const convo = await this.conversationRepo.findOne({ where: { id: conversationId } });
    if (!convo) {
      throw new NotFoundException('会话不存在');
    }
    if (convo.userAId !== userId && convo.userBId !== userId) {
      throw new ForbiddenException('无权访问该会话');
    }
    return convo;
  }

  /** 按用户对查找现有会话 */
  private async findPair(userId: string, peerId: string): Promise<Conversation | null> {
    const [userAId, userBId] = this.normalizePair(userId, peerId);
    return this.conversationRepo.findOne({ where: { userAId, userBId } });
  }

  /** 规范化用户对：较小的放 A，较大的放 B */
  private normalizePair(id1: string, id2: string): [string, string] {
    if (BigInt(id1) < BigInt(id2)) {
      return [id1, id2];
    }
    return [id2, id1];
  }
}
