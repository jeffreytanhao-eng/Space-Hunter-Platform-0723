import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { GalleryPhoto } from '../../database/entities/gallery-photo.entity';
import { Post } from '../../database/entities/post.entity';
import { AdminLog } from '../../database/entities/admin-log.entity';
import { FitsAsset } from '../../database/entities/fits-asset.entity';
import { PointsService } from '../points/points.service';
import { CosService } from '../upload/cos.service';
import { RedisService } from '../redis/redis.service';

describe('GalleryService', () => {
  let service: GalleryService;
  let galleryRepo: any;
  let postRepo: any;
  let pointsService: any;
  let redisService: any;

  // Mock 画廊照片数据
  const mockPhoto = {
    id: '1',
    userId: 'user1',
    postId: null,
    title: '测试照片',
    description: '测试描述',
    imageUrl: 'https://example.com/image.jpg',
    originalUrl: null,
    metadata: null,
    category: null,
    status: 'pending',
    pointsAwarded: 0,
    likeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock Repository 工厂
  const createMockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    }),
  });

  beforeEach(async () => {
    galleryRepo = createMockRepo();
    postRepo = createMockRepo();
    const adminLogRepo = createMockRepo();
    const fitsAssetRepo = createMockRepo();

    // Mock PointsService
    pointsService = {
      earnPoints: jest.fn().mockResolvedValue({ id: 'tx1' }),
    };

    // Mock CosService
    const cosService = {
      getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.com/file'),
    };

    // Mock RedisService
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GalleryService,
        { provide: getRepositoryToken(GalleryPhoto), useValue: galleryRepo },
        { provide: getRepositoryToken(Post), useValue: postRepo },
        { provide: getRepositoryToken(AdminLog), useValue: adminLogRepo },
        { provide: getRepositoryToken(FitsAsset), useValue: fitsAssetRepo },
        { provide: PointsService, useValue: pointsService },
        { provide: CosService, useValue: cosService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<GalleryService>(GalleryService);

    jest.clearAllMocks();
  });

  describe('apply', () => {
    // 申请进入画廊成功（通过 imageUrl）
    it('通过 imageUrl 申请进入画廊成功', async () => {
      const dto = {
        imageUrl: 'https://example.com/photo.jpg',
        title: '星空照片',
        description: '美丽的星空',
      };

      const createdPhoto = { ...mockPhoto, ...dto };
      galleryRepo.create.mockReturnValue(createdPhoto);
      galleryRepo.save.mockResolvedValue(createdPhoto);

      const result = await service.apply('user1', dto);

      expect(galleryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          imageUrl: 'https://example.com/photo.jpg',
          status: 'pending',
        }),
      );
      expect(galleryRepo.save).toHaveBeenCalled();
      expect(result.status).toBe('pending');
    });

    // 通过 postId 申请进入画廊
    it('通过 postId 申请进入画廊成功', async () => {
      const dto = {
        postId: 'post1',
        title: '帖子照片',
      };

      // 模拟关联帖子存在且已发布
      postRepo.findOne.mockResolvedValue({
        id: 'post1',
        status: 'published',
        images: [{ url: 'https://example.com/post-image.jpg', type: 'image' }],
      });
      // 无 FITS 资产
      const fitsAssetRepo = createMockRepo();
      fitsAssetRepo.findOne.mockResolvedValue(null);

      const createdPhoto = { ...mockPhoto, postId: 'post1' };
      galleryRepo.create.mockReturnValue(createdPhoto);
      galleryRepo.save.mockResolvedValue(createdPhoto);

      const result = await service.apply('user1', dto);

      expect(postRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'post1' } }),
      );
    });

    // 缺少 postId 和 imageUrl 时抛出异常
    it('缺少 postId 和 imageUrl 时应抛出 BadRequestException', async () => {
      const dto = { title: '无图照片' };

      await expect(service.apply('user1', dto as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.apply('user1', dto as any)).rejects.toThrow(
        '必须提供 postId 或 imageUrl',
      );
    });

    // 关联帖子不存在时抛出异常
    it('关联帖子不存在时应抛出 NotFoundException', async () => {
      const dto = { postId: 'nonexistent', title: '测试' };
      postRepo.findOne.mockResolvedValue(null);

      await expect(service.apply('user1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('review', () => {
    // 审核通过发放积分
    it('审核通过应发放 100 积分', async () => {
      const dto = { status: 'approved' as const, reason: '优秀作品' };

      galleryRepo.findOne.mockResolvedValue({ ...mockPhoto, status: 'pending' });
      galleryRepo.save.mockImplementation((photo: any) => {
        photo.pointsAwarded = 100;
        return Promise.resolve(photo);
      });
      // Mock adminLogRepo.save
      const adminLogRepo = createMockRepo();
      adminLogRepo.create.mockReturnValue({});
      adminLogRepo.save.mockResolvedValue({});

      const result = await service.review('admin1', '1', dto);

      // 验证积分发放
      expect(pointsService.earnPoints).toHaveBeenCalledWith(
        'user1',
        100,
        'gallery_approved',
        '1',
        'gallery_approved:1',
        '画廊审核通过奖励',
      );
    });

    // 已审核的照片不能重复审核
    it('已审核的照片不能重复审核', async () => {
      const dto = { status: 'approved' as const };
      galleryRepo.findOne.mockResolvedValue({
        ...mockPhoto,
        status: 'approved', // 已审核
      });

      await expect(service.review('admin1', '1', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.review('admin1', '1', dto)).rejects.toThrow(
        '该照片已审核',
      );
    });

    // 照片不存在时抛出异常
    it('照片不存在时应抛出 NotFoundException', async () => {
      const dto = { status: 'approved' as const };
      galleryRepo.findOne.mockResolvedValue(null);

      await expect(service.review('admin1', '999', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
