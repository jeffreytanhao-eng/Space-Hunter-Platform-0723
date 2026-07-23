import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import COS from 'cos-nodejs-sdk-v5';
import { Stream } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 腾讯云 COS 服务
 * Phase 0: 如未配置 COS 则降级为本地存储
 */
@Injectable()
export class CosService {
  private readonly cos: COS | null = null;
  private readonly bucket: string;
  private readonly region: string;
  private readonly cdnDomain: string;
  private readonly localBaseDir: string;
  private readonly useLocal: boolean;
  private readonly logger = new Logger(CosService.name);

  constructor(private configService: ConfigService) {
    const secretId = this.configService.get<string>('COS_SECRET_ID', '');
    const secretKey = this.configService.get<string>('COS_SECRET_KEY', '');
    this.bucket = this.configService.get<string>('COS_BUCKET', '');
    this.region = this.configService.get<string>('COS_REGION', 'ap-guangzhou');
    this.cdnDomain = this.configService.get<string>('COS_CDN_DOMAIN', '');
    this.localBaseDir = this.configService.get<string>('UPLOAD_LOCAL_DIR', './uploads');

    // 未配置 COS 凭证时降级为本地存储
    this.useLocal = !secretId || !secretKey || !this.bucket;

    if (this.useLocal) {
      this.logger.warn('COS 未配置，使用本地存储降级方案');
      // 确保本地目录存在
      if (!fs.existsSync(this.localBaseDir)) {
        fs.mkdirSync(this.localBaseDir, { recursive: true });
      }
    } else {
      this.cos = new COS({
        SecretId: secretId,
        SecretKey: secretKey,
      });
    }
  }

  /** 上传 Buffer 到 COS */
  async uploadBuffer(buffer: Buffer, key: string): Promise<string> {
    if (this.useLocal) {
      return this.uploadBufferLocal(buffer, key);
    }

    return new Promise((resolve, reject) => {
      this.cos!.putObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          Body: buffer,
        },
        (err, data) => {
          if (err) {
            this.logger.error(`COS 上传失败: ${err.message}`);
            reject(err);
          } else {
            resolve(this.getUrl(key));
          }
        },
      );
    });
  }

  /** 上传流到 COS（大文件） */
  async uploadStream(stream: Stream, key: string, size: number): Promise<string> {
    if (this.useLocal) {
      return this.uploadStreamLocal(stream, key);
    }

    return new Promise((resolve, reject) => {
      this.cos!.putObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          Body: stream,
          ContentLength: size,
        },
        (err, data) => {
          if (err) {
            this.logger.error(`COS 流式上传失败: ${err.message}`);
            reject(err);
          } else {
            resolve(this.getUrl(key));
          }
        },
      );
    });
  }

  /** 生成临时签名下载 URL */
  async getSignedUrl(key: string, expires: number = 300): Promise<string> {
    if (this.useLocal) {
      // 本地模式返回直接路径
      return `/local-files/${key}`;
    }

    return new Promise((resolve, reject) => {
      this.cos!.getObjectUrl(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          Sign: true,
          Expires: expires,
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.Url);
          }
        },
      );
    });
  }

  /** 删除 COS 对象 */
  async deleteObject(key: string): Promise<void> {
    if (this.useLocal) {
      const filePath = path.join(this.localBaseDir, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      this.cos!.deleteObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
        },
        (err, data) => {
          if (err) {
            this.logger.error(`COS 删除失败: ${err.message}`);
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }

  /** 获取文件访问 URL */
  private getUrl(key: string): string {
    if (this.cdnDomain) {
      return `https://${this.cdnDomain}/${key}`;
    }
    return `https://${this.bucket}.cos.${this.region}.myqcloud.com/${key}`;
  }

  /** 本地降级：Buffer 写入文件 */
  private async uploadBufferLocal(buffer: Buffer, key: string): Promise<string> {
    const filePath = path.join(this.localBaseDir, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return `/local-files/${key}`;
  }

  /** 本地降级：流写入文件 */
  private async uploadStreamLocal(stream: Stream, key: string): Promise<string> {
    const filePath = path.join(this.localBaseDir, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);
      writeStream.on('finish', () => resolve(`/local-files/${key}`));
      writeStream.on('error', reject);
    });
  }
}
