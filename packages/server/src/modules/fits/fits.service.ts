import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FitsAsset } from '../../database/entities/fits-asset.entity';
import { Post } from '../../database/entities/post.entity';
import { CosService } from '../upload/cos.service';
import { RedisService } from '../redis/redis.service';
import { FitsCallbackDto } from './dto/fits-callback.dto';

/** 下载频率限制：5分钟内同用户最多 10 次 */
const DOWNLOAD_RATE_LIMIT = 10;
const DOWNLOAD_RATE_WINDOW = 300; // 5 分钟（秒）

@Injectable()
export class FitsService {
  private readonly logger = new Logger(FitsService.name);

  constructor(
    @InjectRepository(FitsAsset)
    private readonly fitsAssetRepo: Repository<FitsAsset>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly cosService: CosService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 查询 FITS 处理状态
   */
  async getFitsStatus(postId: string, jobId?: string): Promise<FitsAsset[]> {
    const where: any = { postId };
    if (jobId) {
      where.jobId = jobId;
    }

    const assets = await this.fitsAssetRepo.find({
      where,
      select: [
        'id',
        'jobId',
        'format',
        'status',
        'previewUrl',
        'error',
        'retryCount',
        'createdAt',
        'completedAt',
      ],
    });

    return assets;
  }

  /**
   * 生成 COS 临时签名下载 URL（5分钟有效）
   * 鉴权：发帖者本人直接允许，其他用户要求帖子 published
   * 防滥用：5分钟内同用户下载 ≤10 次
   */
  async downloadOriginal(
    postId: string,
    userId: string,
  ): Promise<{ url: string }> {
    // 查询帖子
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 鉴权：发帖者本人直接允许，其他用户要求帖子 published
    if (post.userId !== userId && post.status !== 'published') {
      throw new ForbiddenException('该帖子尚未发布，无法下载原始文件');
    }

    // 查询 FitsAsset
    const asset = await this.fitsAssetRepo.findOne({ where: { postId } });
    if (!asset) {
      throw new NotFoundException('未找到关联的 FITS 文件');
    }

    // 防滥用：检查下载频率
    await this.checkDownloadRateLimit(userId, postId);

    // 从 originalUrl 提取 COS key
    const cosKey = this.extractCosKey(asset.originalUrl);

    // 生成临时签名 URL（5分钟有效）
    const signedUrl = await this.cosService.getSignedUrl(cosKey, 300);

    return { url: signedUrl };
  }

  /**
   * 处理 Worker 回调
   * 更新 FitsAsset 记录，更新 Post.hasFits，处理失败时记录 error
   */
  async handleCallback(dto: FitsCallbackDto): Promise<void> {
    const asset = await this.fitsAssetRepo.findOne({
      where: { jobId: dto.jobId },
    });

    if (!asset) {
      this.logger.warn(`回调未找到 FitsAsset: jobId=${dto.jobId}`);
      throw new NotFoundException(`未找到任务: ${dto.jobId}`);
    }

    if (dto.status === 'ready') {
      // 处理成功
      asset.status = 'ready';
      asset.previewUrl = dto.previewUrl || null;
      asset.previewSize = dto.previewSize ? String(dto.previewSize) : null;
      asset.metadata = dto.metadata || null;
      asset.completedAt = new Date();

      await this.fitsAssetRepo.save(asset);

      // 更新 Post.hasFits = true
      if (asset.postId && asset.postId !== '0') {
        await this.postRepo.update(
          { id: asset.postId },
          { hasFits: true },
        );
      }

      this.logger.log(`FITS 处理完成: jobId=${dto.jobId}`);
    } else {
      // 处理失败
      asset.status = 'failed';
      asset.error = dto.error || '处理失败';
      asset.retryCount += 1;
      asset.completedAt = new Date();

      await this.fitsAssetRepo.save(asset);

      this.logger.warn(
        `FITS 处理失败: jobId=${dto.jobId}, error=${dto.error}, retryCount=${asset.retryCount}`,
      );
    }
  }

  /**
   * 检查下载频率限制
   * 5分钟内同用户下载 ≤10 次
   */
  private async checkDownloadRateLimit(
    userId: string,
    postId: string,
  ): Promise<void> {
    const key = `fits:download:${userId}:${postId}`;
    const client = this.redisService.getClient();

    const count = await client.incr(key);
    if (count === 1) {
      // 首次访问，设置过期时间
      await client.expire(key, DOWNLOAD_RATE_WINDOW);
    }

    if (count > DOWNLOAD_RATE_LIMIT) {
      throw new BadRequestException('下载频率超限，请 5 分钟后再试');
    }
  }

  /** 从 URL 提取 COS key */
  private extractCosKey(url: string): string {
    try {
      // 尝试从完整 URL 中提取路径部分
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // 去掉开头的 /
    } catch {
      // 如果不是完整 URL，可能是本地路径 /local-files/xxx
      if (url.startsWith('/local-files/')) {
        return url.replace('/local-files/', '');
      }
      // 直接作为 key 返回
      return url;
    }
  }
}
