import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ImageProcessJob } from '../../database/entities/image-process-job.entity';

const execFileAsync = promisify(execFile);

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const CLEANUP_DAYS = 7; // 7 天后自动清理

@Injectable()
export class ImageProcessService {
  private readonly logger = new Logger(ImageProcessService.name);
  private readonly uploadDir: string;
  private readonly scriptPath: string;

  constructor(
    @InjectRepository(ImageProcessJob)
    private readonly jobRepo: Repository<ImageProcessJob>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_LOCAL_DIR', './uploads');
    // 脚本路径：优先用环境变量，否则相对于 uploadDir 向上找到项目根的 scripts 目录
    this.scriptPath = this.configService.get<string>(
      'ASTRO_ENHANCE_SCRIPT',
      '/app/scripts/astro_enhance.py',
    );
  }

  /** 处理上传图片：支持单通道或双通道
   * mode: 'A' - 只跑通道A, 'B' - 只跑通道B, 'both' - 双通道同时执行
   */
  async processImage(
    file: Express.Multer.File,
    sessionId: string,
    channelAParams: {
      style?: 'classic' | 'smart';
      beta?: number;
      residualRef?: number;
      boxSize?: number;
      zscaleContrast?: number;
      asinhA?: number;
      stretch?: string;
      enableCosmics?: boolean;
      cosmicsSigclip?: number;
      cosmicsObjlim?: number;
    },
    channelBParams: { style?: string; intensity?: number },
    mode: 'A' | 'B' | 'both' = 'both',
  ): Promise<ImageProcessJob> {
    // 校验
    if (!file) throw new BadRequestException('未提供文件');
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(`不支持的图片格式: ${file.mimetype}，仅支持 JPEG/PNG`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('图片大小不能超过 20MB');
    }

    // 获取图片尺寸
    const dimensions = await this.getImageDimensions(file.buffer);

    // 保存原始图片到磁盘
    const jobId = uuidv4();
    const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const originalKey = `image-process/${jobId}/original.${ext}`;
    const originalPath = this.saveBuffer(file.buffer, originalKey);

    // 初始化通道状态：仅在需要时初始化为 pending，否则为 skipped
    const channelAStatus = mode === 'A' || mode === 'both' ? 'pending' : 'skipped';
    const channelBStatus = mode === 'B' || mode === 'both' ? 'pending' : 'skipped';

    // 创建任务记录
    const job = this.jobRepo.create({
      sessionId,
      originalPath: `/local-files/${originalKey}`,
      originalName: file.originalname,
      originalSize: file.size,
      originalWidth: dimensions.width,
      originalHeight: dimensions.height,
      channelAParams: channelAParams as any,
      channelBParams: channelBParams as any,
      channelAStatus,
      channelBStatus,
    });
    await this.jobRepo.save(job);

    // 根据 mode 异步执行对应通道
    if (mode === 'A' || mode === 'both') {
      this.runChannelA(job.id, originalPath, channelAParams).catch((err) => {
        this.logger.error(`通道A处理失败 job=${job.id}: ${err.message}`);
      });
    }
    if (mode === 'B' || mode === 'both') {
      this.runChannelB(job.id, originalPath, channelBParams).catch((err) => {
        this.logger.error(`通道B处理失败 job=${job.id}: ${err.message}`);
      });
    }

    return job;
  }

  /** 通道 A：调用 Python 脚本做保真增强（astropy 专业链路） */
  private async runChannelA(
    jobId: string,
    inputPath: string,
    params: {
      style?: 'classic' | 'smart';
      beta?: number;
      residualRef?: number;
      boxSize?: number;
      zscaleContrast?: number;
      asinhA?: number;
      stretch?: string;
      enableCosmics?: boolean;
      cosmicsSigclip?: number;
      cosmicsObjlim?: number;
    },
  ): Promise<void> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) return;

    await this.jobRepo.update(jobId, { channelAStatus: 'processing' });

    try {
      // inputPath 是 /local-files/... 格式，转换为磁盘路径
      const diskInput = this.urlToDiskPath(inputPath);
      const outputKey = `image-process/${jobId}/channel_a.jpg`;
      const diskOutput = path.join(this.uploadDir, outputKey);

      // 确保输出目录存在
      fs.mkdirSync(path.dirname(diskOutput), { recursive: true });

      const style = params.style ?? 'classic';
      const args = [
        this.scriptPath,
        diskInput,
        '-o', diskOutput,
        '--style', style,
        '--cosmics-sigclip', String(params.cosmicsSigclip ?? 4.5),
        '--cosmics-objlim', String(params.cosmicsObjlim ?? 5.0),
        '--quality', '92',
      ];

      if (style === 'classic') {
        args.push(
          '--beta', String(params.beta ?? 4.0),
          '--residual-ref', String(params.residualRef ?? 50.0),
        );
      } else {
        args.push(
          '--box-size', String(params.boxSize ?? 128),
          '--zscale-contrast', String(params.zscaleContrast ?? 0.25),
          '--asinh-a', String(params.asinhA ?? 0.5),
          '--stretch', params.stretch ?? 'asinh',
        );
      }

      // 禁用宇宙线时追加 flag
      if (params.enableCosmics === false) {
        args.push('--no-cosmics');
      }

      this.logger.log(`通道A开始处理 job=${jobId}, args=${args.join(' ')}`);
      const { stdout, stderr } = await execFileAsync('python3', args, {
        timeout: 120000, // 2 分钟超时
        maxBuffer: 10 * 1024 * 1024,
      });

      if (stderr) {
        this.logger.warn(`通道A脚本 stderr: ${stderr.substring(0, 500)}`);
      }

      // 获取结果文件大小和尺寸
      const resultSize = fs.statSync(diskOutput).size;
      const resultDims = await this.getImageDimensionsFromFile(diskOutput);

      await this.jobRepo.update(jobId, {
        channelAStatus: 'done',
        channelAPath: `/local-files/${outputKey}`,
        channelASize: resultSize,
        channelAWidth: resultDims.width,
        channelAHeight: resultDims.height,
        channelAError: null,
      });
      this.logger.log(`通道A处理完成 job=${jobId}, size=${resultSize}, dims=${resultDims.width}x${resultDims.height}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`通道A处理失败 job=${jobId}: ${errorMsg}`);
      await this.jobRepo.update(jobId, {
        channelAStatus: 'failed',
        channelAError: errorMsg.substring(0, 1000),
      });
    }
  }

  /** 通道 B：AI 渲染占位实现（复制原图 + 轻微调色模拟艺术效果） */
  private async runChannelB(
    jobId: string,
    inputPath: string,
    params: { style?: string; intensity?: number },
  ): Promise<void> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) return;

    await this.jobRepo.update(jobId, { channelBStatus: 'processing' });

    try {
      // 占位实现：用 Python 做简单的色彩增强模拟 AI 渲染效果
      const diskInput = this.urlToDiskPath(inputPath);
      const outputKey = `image-process/${jobId}/channel_b.jpg`;
      const diskOutput = path.join(this.uploadDir, outputKey);

      fs.mkdirSync(path.dirname(diskOutput), { recursive: true });

      // 用 Python 做占位处理：饱和度提升 + 轻微高斯模糊叠加（梦幻效果）
      const placeholderScript = `
import sys
from PIL import Image, ImageEnhance, ImageFilter
img = Image.open(sys.argv[1]).convert('RGB')
intensity = float(sys.argv[3])
# 饱和度提升
enhancer = ImageEnhance.Color(img)
img = enhancer.enhance(1.0 + 0.4 * intensity)
# 亮度微调
img = ImageEnhance.Brightness(img).enhance(1.0 + 0.1 * intensity)
# 轻微暖色调
import numpy as np
arr = np.array(img).astype(np.float32)
arr[:, :, 0] = np.clip(arr[:, :, 0] + 10 * intensity, 0, 255)  # R+
arr[:, :, 2] = np.clip(arr[:, :, 2] - 10 * intensity, 0, 255)  # B-
img = Image.fromarray(arr.astype(np.uint8))
img.save(sys.argv[2], quality=90)
`;
      const args = [
        '-c',
        placeholderScript,
        diskInput,
        diskOutput,
        String(params.intensity ?? 0.5),
      ];

      this.logger.log(`通道B占位处理开始 job=${jobId}, style=${params.style || 'default'}`);
      await execFileAsync('python3', args, {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      });

      // 获取结果文件大小和尺寸
      const resultSize = fs.statSync(diskOutput).size;
      const resultDims = await this.getImageDimensionsFromFile(diskOutput);

      await this.jobRepo.update(jobId, {
        channelBStatus: 'done',
        channelBPath: `/local-files/${outputKey}`,
        channelBSize: resultSize,
        channelBWidth: resultDims.width,
        channelBHeight: resultDims.height,
        channelBError: null,
      });
      this.logger.log(`通道B占位处理完成 job=${jobId}, size=${resultSize}, dims=${resultDims.width}x${resultDims.height}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`通道B处理失败 job=${jobId}: ${errorMsg}`);
      await this.jobRepo.update(jobId, {
        channelBStatus: 'failed',
        channelBError: errorMsg.substring(0, 1000),
      });
    }
  }

  /** 查询任务状态 */
  async getJob(jobId: string): Promise<ImageProcessJob> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('任务不存在');
    return job;
  }

  /** 获取历史记录（全局共享） */
  async getHistory(page = 1, pageSize = 20): Promise<{
    data: ImageProcessJob[];
    total: number;
  }> {
    const [data, total] = await this.jobRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total };
  }

  /** 删除历史记录（同时删除磁盘文件） */
  async deleteJob(id: string): Promise<void> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException('记录不存在');
    }

    // 删除磁盘文件
    const pathsToDelete: string[] = [];
    if (job.originalPath) pathsToDelete.push(job.originalPath);
    if (job.channelAPath) pathsToDelete.push(job.channelAPath);
    if (job.channelBPath) pathsToDelete.push(job.channelBPath);

    for (const p of pathsToDelete) {
      try {
        // 去掉 /local-files/ 前缀，拿相对路径
        const rel = p.replace('/local-files/', '');
        const fullPath = path.join(this.uploadDir, '..', rel);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          // 尝试删除空目录
          const dir = path.dirname(fullPath);
          try { fs.rmdirSync(dir); } catch { /* 非空就保留 */ }
        }
      } catch (e) {
        this.logger.warn(`删除文件失败 ${p}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await this.jobRepo.delete(id);
  }

  /** 清理过期任务（7天前的） */
  async cleanupExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000);
    const expired = await this.jobRepo.find({
      where: { createdAt: LessThan(cutoff) },
    });

    let deleted = 0;
    for (const job of expired) {
      // 删除磁盘文件
      const dirs = [job.channelAPath, job.channelBPath, job.originalPath];
      for (const url of dirs) {
        if (url) {
          try {
            const diskPath = this.urlToDiskPath(url);
            if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
          } catch (e) {
            this.logger.warn(`清理文件失败: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      }
      // 删除任务目录
      try {
        const jobDir = path.join(this.uploadDir, 'image-process', job.id);
        if (fs.existsSync(jobDir)) fs.rmSync(jobDir, { recursive: true });
      } catch (e) {
        // ignore
      }
      await this.jobRepo.delete(job.id);
      deleted++;
    }

    if (deleted > 0) {
      this.logger.log(`清理过期任务: ${deleted} 条`);
    }
    return deleted;
  }

  // ---- 工具方法 ----

  /** 保存 Buffer 到本地磁盘 */
  private saveBuffer(buffer: Buffer, key: string): string {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return `/local-files/${key}`;
  }

  /** /local-files/xxx → 磁盘绝对路径 */
  private urlToDiskPath(url: string): string {
    if (url.startsWith('/local-files/')) {
      return path.join(this.uploadDir, url.replace('/local-files/', ''));
    }
    return url;
  }

  /** 从磁盘文件获取图片尺寸 */
  private async getImageDimensionsFromFile(filePath: string): Promise<{ width: number; height: number }> {
    try {
      const script = `import sys; from PIL import Image; img=Image.open(sys.argv[1]); print(f"{img.width},{img.height}")`;
      const { stdout } = await execFileAsync('python3', ['-c', script, filePath], {
        timeout: 10000,
      });
      const [w, h] = stdout.trim().split(',').map(Number);
      return { width: w || 0, height: h || 0 };
    } catch {
      return { width: 0, height: 0 };
    }
  }

  /** 获取图片尺寸（通过 Python PIL，避免引入额外 Node 依赖） */
  private async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    // 写入临时文件让 Python 读取
    const tmpFile = path.join(this.uploadDir, `_tmp_${Date.now()}.img`);
    fs.writeFileSync(tmpFile, buffer);
    try {
      const script = `from PIL import Image; img=Image.open(sys.argv[1]); print(f"{img.width},{img.height}")`;
      const { stdout } = await execFileAsync('python3', ['-c', `import sys; ${script}`, tmpFile], {
        timeout: 10000,
      });
      const [w, h] = stdout.trim().split(',').map(Number);
      return { width: w || 0, height: h || 0 };
    } catch {
      // Python 不可用时返回 0，不阻塞流程
      return { width: 0, height: 0 };
    } finally {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  }
}
