import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from '../../database/entities/post.entity';
import { Comment } from '../../database/entities/comment.entity';
import { FitsAsset } from '../../database/entities/fits-asset.entity';
import { PointsTransaction } from '../../database/entities/points-transaction.entity';

describe('PostsService', () => {
  let service: PostsService;
  let postRepo: any;
  let pointsTxRepo: any;

  // Mock 帖子数据
  const mockPost = {
    id: '1',
    userId: 'user1',
    sectionId: 'section1',
    title: '测试帖子',
    content: '测试内容',
    images: null,
    tags: null,
    hasFits: false,
    status: 'published',
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock Repository 工厂
  const createMockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      where: jest.fn().mockReturnThis(),
    }),
  });

  beforeEach(async () => {
    postRepo = createMockRepo();
    const commentRepo = createMockRepo();
    const fitsAssetRepo = createMockRepo();
    pointsTxRepo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: postRepo },
        { provide: getRepositoryToken(Comment), useValue: commentRepo },
        { provide: getRepositoryToken(FitsAsset), useValue: fitsAssetRepo },
        { provide: getRepositoryToken(PointsTransaction), useValue: pointsTxRepo },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    // 创建帖子成功
    it('创建帖子成功', async () => {
      const dto = {
        sectionId: 'section1',
        title: '新帖子',
        content: '新帖子内容',
      };

      const createdPost = { ...mockPost, ...dto };
      postRepo.create.mockReturnValue(createdPost);
      postRepo.save.mockResolvedValue(createdPost);
      // 积分流水幂等检查：不存在
      pointsTxRepo.findOne.mockResolvedValue(null);
      pointsTxRepo.create.mockReturnValue({});
      pointsTxRepo.save.mockResolvedValue({});

      const result = await service.create('user1', dto);

      expect(postRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          title: '新帖子',
          content: '新帖子内容',
        }),
      );
      expect(postRepo.save).toHaveBeenCalled();
      expect(result.title).toBe('新帖子');
    });

    // 创建含 FITS 文件的帖子
    it('创建含 FITS 文件的帖子应标记 hasFits=true', async () => {
      const dto = {
        sectionId: 'section1',
        title: 'FITS 帖子',
        content: 'FITS 内容',
        images: [{ url: 'https://example.com/file.fits', type: 'fits' as const }],
      };

      const createdPost = { ...mockPost, ...dto, hasFits: true };
      postRepo.create.mockReturnValue(createdPost);
      postRepo.save.mockResolvedValue(createdPost);
      pointsTxRepo.findOne.mockResolvedValue(null);
      pointsTxRepo.create.mockReturnValue({});
      pointsTxRepo.save.mockResolvedValue({});

      const result = await service.create('user1', dto);

      expect(postRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ hasFits: true }),
      );
    });
  });

  describe('findAll', () => {
    // 分页查询返回正确结构
    it('分页查询返回正确结构', async () => {
      const query = { page: 1, pageSize: 10 };

      const result = await service.findAll(query);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('pageSize', 10);
      expect(result).toHaveProperty('totalPages');
    });

    // 非管理员只能看 published 状态
    it('非管理员查询应过滤 published 状态', async () => {
      const query = { page: 1, pageSize: 10 };

      await service.findAll(query, 'user');

      // 验证 createQueryBuilder 被调用
      expect(postRepo.createQueryBuilder).toHaveBeenCalledWith('post');
    });

    // 管理员可查看所有状态
    it('管理员查询不过滤状态', async () => {
      const query = { page: 1, pageSize: 10 };

      await service.findAll(query, 'admin');

      expect(postRepo.createQueryBuilder).toHaveBeenCalledWith('post');
    });
  });

  describe('toggleLike', () => {
    // 首次点赞成功
    it('首次点赞成功', async () => {
      postRepo.findOne.mockResolvedValue({ ...mockPost, likeCount: 0 });
      pointsTxRepo.findOne.mockResolvedValue(null); // 不存在点赞记录
      pointsTxRepo.create.mockReturnValue({});
      pointsTxRepo.save.mockResolvedValue({});
      postRepo.save.mockResolvedValue({ ...mockPost, likeCount: 1 });

      const result = await service.toggleLike('user2', '1');

      expect(result.liked).toBe(true);
    });

    // 取消点赞
    it('已点赞时再次操作应取消点赞', async () => {
      postRepo.findOne.mockResolvedValue({ ...mockPost, likeCount: 1 });
      // 存在点赞记录
      pointsTxRepo.findOne.mockResolvedValue({
        id: 'tx1',
        idempotencyKey: 'like:user2:1',
      });
      pointsTxRepo.remove.mockResolvedValue({});
      postRepo.save.mockResolvedValue({ ...mockPost, likeCount: 0 });

      const result = await service.toggleLike('user2', '1');

      expect(result.liked).toBe(false);
      expect(pointsTxRepo.remove).toHaveBeenCalled();
    });

    // 帖子不存在时抛出异常
    it('帖子不存在时应抛出 NotFoundException', async () => {
      postRepo.findOne.mockResolvedValue(null);

      await expect(service.toggleLike('user2', '999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
