import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FitsAsset } from '../../database/entities/fits-asset.entity';
import { CosService } from './cos.service';
import { RedisService } from '../redis/redis.service';

/** 普通图片允许的格式 */
const IMAGE_ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const IMAGE_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB

/** 专业天文格式允许的格式 */
const ASTRO_ALLOWED_FORMATS = ['fits', 'fit', 'tiff', 'tif', 'cr2', 'nef', 'arw'];
const ASTRO_ALLOWED_MIMES: Record<string, string[]> = {
  fits: ['image/fits', 'application/fits', 'application/octet-stream'],
  fit: ['image/fits', 'application/fits', 'application/octet-stream'],
  tiff: ['image/tiff'],
  tif: ['image/tiff'],
  cr2: ['image/x-canon-cr2', 'image/x-raw', 'application/octet-stream'],
  nef: ['image/x-nikon-nef', 'image/x-raw', 'application/octet-stream'],
  arw: ['image/x-sony-arw', 'image/x-raw', 'application/octet-stream'],
};
const FITS_MAX_SIZE = 100 * 1024 * 1024; // 100MB
const TIFF_RAW_MAX_SIZE = 50 * 1024 * 1024; // 50MB

/** 魔数定义 */
const MAGIC_NUMBERS = {
  fits: Buffer.from('SIMPLE  ='),
  tiff_le: Buffer.from([0x49, 0x49, 0x2a, 0x00]), // II*\x00
  tiff_be: Buffer.from([0x4d, 0x4d, 0x00, 0x2a]), // MM\x00*
  cr2: Buffer.from([0x49, 0x49, 0x2a, 0x00]), // CR2 基于 TIFF 格式，小端序
  nef: Buffer.from([0x49, 0x49, 0x2a, 0x00]), // NEF 基于 TIFF 格式，小端序
  arw: Buffer.from([0x49, 0x49, 0x2a, 0x00]), // ARW 基于 TIFF 格式，小端序
};

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectRepository(FitsAsset)
    private readonly fitsAssetRepo: Repository<FitsAsset>,
    private readonly cosService: CosService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 普通图片上传
   * 校验格式、大小、MIME+扩展名双校验，上传到 COS，返回 CDN URL
   */
  async uploadImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ type: 'image'; url: string }> {
    // 校验文件
    this.validateFile(file);

    const ext = this.getExtension(file.originalname);
    if (!IMAGE_ALLOWED_FORMATS.includes(ext)) {
      throw new BadRequestException(
        `不支持的图片格式: ${ext}，允许: ${IMAGE_ALLOWED_FORMATS.join(', ')}`,
      );
    }

    // MIME + 扩展名双校验
    if (!IMAGE_ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(`不支持的 MIME 类型: ${file.mimetype}`);
    }

    // 大小校验
    if (file.size > IMAGE_MAX_SIZE) {
      throw new BadRequestException('图片大小不能超过 10MB');
    }

    // 生成 COS 路径并上传
    const key = this.generateCosPath('posts', userId, ext);
    const url = await this.cosService.uploadBuffer(file.buffer, key);

    return { type: 'image', url };
  }

  /**
   * 专业天文格式上传
   * MIME + 扩展名 + 魔数三重校验，上传原始文件到 COS，创建 FitsAsset，入 Redis 队列
   */
  async uploadAstroImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{
    type: 'fits';
    jobId: string;
    status: string;
    originalUrl: string;
    pollIntervalMs: number;
    maxPollMs: number;
  }> {
    const ext = this.getExtension(file.originalname);
    const normalizedExt = this.normalizeAstroExt(ext);

    if (!ASTRO_ALLOWED_FORMATS.includes(ext) && !ASTRO_ALLOWED_FORMATS.includes(normalizedExt)) {
      throw new BadRequestException(
        `不支持的天文格式: ${ext}，允许: ${ASTRO_ALLOWED_FORMATS.join(', ')}`,
      );
    }

    // MIME 校验
    const allowedMimes = ASTRO_ALLOWED_MIMES[normalizedExt] || ASTRO_ALLOWED_MIMES[ext] || [];
    if (!allowedMimes.includes(file.mimetype) && file.mimetype !== 'application/octet-stream') {
      // 对于专业格式，application/octet-stream 是常见 MIME，放宽校验
      this.logger.warn(`天文格式 MIME 校验放宽: ${file.mimetype}, 扩展名: ${ext}`);
    }

    // 大小校验
    const maxSize = this.getAstroMaxSize(normalizedExt);
    if (file.size > maxSize) {
      const maxMB = Math.floor(maxSize / 1024 / 1024);
      throw new BadRequestException(`${normalizedExt.toUpperCase()} 文件大小不能超过 ${maxMB}MB`);
    }

    // 魔数校验
    this.validateMagicNumber(file.buffer, normalizedExt);

    // 生成 jobId 和 COS 路径
    const jobId = uuidv4();
    const cosKey = `fits/original/${jobId}.${normalizedExt}`;

    // 上传原始文件到 COS
    const originalUrl = await this.cosService.uploadBuffer(file.buffer, cosKey);

    // 创建 FitsAsset 记录
    const idempotencyKey = `upload:${userId}:${jobId}`;
    const fitsAsset = this.fitsAssetRepo.create({
      jobId,
      postId: '0', // 临时占位，发帖时关联
      userId,
      format: normalizedExt,
      originalUrl,
      originalSize: String(file.size),
      status: 'pending',
      idempotencyKey,
    });
    await this.fitsAssetRepo.save(fitsAsset);

    // 入 Redis 队列
    const client = this.redisService.getClient();
    await client.lpush(
      'fits:process',
      JSON.stringify({
        jobId,
        userId,
        format: normalizedExt,
        originalUrl,
        originalSize: file.size,
      }),
    );

    this.logger.log(`天文格式文件已入队: jobId=${jobId}, format=${normalizedExt}`);

    return {
      type: 'fits',
      jobId,
      status: 'pending',
      originalUrl,
      pollIntervalMs: 3000,
      maxPollMs: 120000,
    };
  }

  /**
   * 文件校验封装
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('未提供文件');
    }
    if (!file.originalname) {
      throw new BadRequestException('文件名缺失');
    }
    if (!file.buffer && !file.stream) {
      throw new BadRequestException('文件内容缺失');
    }
  }

  /**
   * 生成 COS 存储路径
   * 格式: {prefix}/{yyyy/MM}/{userId}_{timestamp}_{random}.{ext}
   */
  generateCosPath(prefix: string, userId: string, ext: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime();
    const random = Math.random().toString(36).substring(2, 8);

    return `${prefix}/${year}/${month}/${userId}_${timestamp}_${random}.${ext}`;
  }

  /** 获取文件扩展名（小写，不含点） */
  private getExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length < 2) return '';
    return parts[parts.length - 1].toLowerCase();
  }

  /** 标准化天文格式扩展名 */
  private normalizeAstroExt(ext: string): string {
    const map: Record<string, string> = {
      fit: 'fits',
      tif: 'tiff',
    };
    return map[ext] || ext;
  }

  /** 获取天文格式最大文件大小 */
  private getAstroMaxSize(ext: string): number {
    if (ext === 'fits') return FITS_MAX_SIZE;
    return TIFF_RAW_MAX_SIZE;
  }

  /**
   * 魔数校验
   * FITS: 文件头以 "SIMPLE  =" 开头
   * TIFF: "II*\x00" 或 "MM\x00*"
   * RAW: 按厂商魔数（基于 TIFF 格式头）
   */
  private validateMagicNumber(buffer: Buffer, ext: string): void {
    const header = buffer.subarray(0, 16);

    switch (ext) {
      case 'fits': {
        const fitsMagic = header.subarray(0, MAGIC_NUMBERS.fits.length);
        if (!fitsMagic.equals(MAGIC_NUMBERS.fits)) {
          throw new BadRequestException('FITS 文件魔数校验失败：文件头不以 "SIMPLE  =" 开头');
        }
        break;
      }
      case 'tiff': {
        const tiffMagic = header.subarray(0, 4);
        if (
          !tiffMagic.equals(MAGIC_NUMBERS.tiff_le) &&
          !tiffMagic.equals(MAGIC_NUMBERS.tiff_be)
        ) {
          throw new BadRequestException('TIFF 文件魔数校验失败');
        }
        break;
      }
      case 'cr2':
      case 'nef':
      case 'arw': {
        // RAW 格式基于 TIFF，校验 TIFF 头
        const rawMagic = header.subarray(0, 4);
        if (
          !rawMagic.equals(MAGIC_NUMBERS.cr2) &&
          !rawMagic.equals(MAGIC_NUMBERS.arw)
        ) {
          throw new BadRequestException(`${ext.toUpperCase()} 文件魔数校验失败`);
        }
        break;
      }
      default:
        this.logger.warn(`未实现魔数校验的格式: ${ext}`);
    }
  }
}
