import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../database/entities/comment.entity';
import { Post } from '../../database/entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  /** 按时间排序的评论列表 */
  async findByPost(
    postId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResult<Comment>> {
    const [data, total] = await this.commentRepo.findAndCount({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** 创建评论，更新 post.comment_count */
  async create(userId: string, postId: string, dto: CreateCommentDto): Promise<Comment> {
    // 确认帖子存在
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const comment = this.commentRepo.create({
      postId,
      userId,
      content: dto.content,
    });

    const saved = await this.commentRepo.save(comment);

    // 更新评论计数
    await this.postRepo.increment({ id: postId }, 'commentCount', 1);

    return saved;
  }

  /** 删除评论，更新 post.comment_count */
  async remove(userId: string, commentId: string, userRole?: string): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.userId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('仅作者或管理员可删除评论');
    }

    await this.commentRepo.remove(comment);

    // 更新评论计数
    await this.postRepo.decrement(
      { id: comment.postId },
      'commentCount',
      1,
    );
  }
}
