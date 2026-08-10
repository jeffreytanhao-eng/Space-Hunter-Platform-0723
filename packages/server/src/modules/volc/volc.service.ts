import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { imagex } from '@volcengine/openapi';

/** 上传地址申请结果 */
export interface UploadUrlResult {
  file_id: string;
  method: string;
  upload_url: string;
}

/** 画质增强任务结果 */
export interface EnhanceResult {
  image_url: string;
  image_size: number;
  image_format: string;
  image_width: number;
  image_height: number;
}

/** AIGC 大模型超分结果（veImageX AIProcess 同步返回） */
export interface AiUpscaleResult {
  image_url: string;
  format: string;
  size: number;
}

/**
 * 火山引擎 AI 服务
 *
 * 1) MediaKit enhance-image（Bearer API Key）：修复型增强，三档
 * 2) veImageX AIProcess（AK/SK 签名）：AIGC 大模型超分，最高 30x
 */
@Injectable()
export class VolcService {
  private readonly logger = new Logger(VolcService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  // veImageX AIGC 超分配置（AK/SK 签名）
  private readonly imagexServiceId: string;
  private readonly imagexAk: string;
  private readonly imagexSk: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'VOLC_MEDIAKIT_BASE_URL',
      'https://mediakit.cn-beijing.volces.com/api/v1',
    );
    this.apiKey = this.configService.get<string>('VOLC_MEDIAKIT_API_KEY', '');
    this.imagexServiceId = this.configService.get<string>('VOLC_IMAGEX_SERVICE_ID', '');
    this.imagexAk = this.configService.get<string>('VOLC_IMAGEX_AK', '');
    this.imagexSk = this.configService.get<string>('VOLC_IMAGEX_SK', '');
  }

  /** 是否已配置 API Key */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /** 步骤1：申请媒体上传地址与 file_id */
  async requestUploadUrl(): Promise<UploadUrlResult> {
    const res = await this.request<{ result: UploadUrlResult }>(
      'tools-sync/request-media-upload-url',
      {},
    );
    return res.result;
  }

  /** 步骤2：上传本地文件到火山（PUT raw binary） */
  async uploadFile(uploadUrl: string, buffer: Buffer, mime: string): Promise<void> {
    try {
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mime },
        body: buffer,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`火山文件上传失败: ${res.status} ${text}`);
        throw new BadRequestException('文件上传火山失败');
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`火山文件上传网络异常: ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException('文件上传火山失败，请稍后重试');
    }
  }

  /** 代理抓取外部图片字节（用于规避浏览器跨域限制） */
  async fetchExternalImage(url: string): Promise<Buffer> {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) {
        throw new BadRequestException(`图片下载失败: ${res.status}`);
      }
      const arr = await res.arrayBuffer();
      return Buffer.from(arr);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`代理抓图网络异常: ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException('图片下载失败，请稍后重试');
    }
  }

  /** 步骤3：提交图像画质增强任务（同步接口，直接返回结果） */
  async enhanceImage(options: {
    imageUrl: string;
    toolVersion?: string;
    multiple?: number;
    targetWidth?: number;
    targetHeight?: number;
  }): Promise<EnhanceResult> {
    const body: Record<string, unknown> = {
      image_url: options.imageUrl,
      tool_version: options.toolVersion || 'standard',
    };
    if (options.multiple) body.multiple = options.multiple;
    if (options.targetWidth) body.target_width = options.targetWidth;
    if (options.targetHeight) body.target_height = options.targetHeight;

    const res = await this.request<{ result: EnhanceResult }>('tools-sync/enhance-image', body);
    return res.result;
  }

  /** veImageX AIGC 超分是否已配置 */
  isImagexConfigured(): boolean {
    return !!this.imagexServiceId && !!this.imagexAk && !!this.imagexSk;
  }

  /**
   * veImageX AIGC 大模型超分（AIProcess 同步接口，AK/SK 签名）
   * @param imageUrl 公网可访问的原图 URL
   * @param multiple 放大倍数（最高 30）
   */
  async aiUpscale(imageUrl: string, multiple = 4): Promise<AiUpscaleResult> {
    if (!this.isImagexConfigured()) {
      throw new BadRequestException(
        'veImageX 未配置，请设置 VOLC_IMAGEX_SERVICE_ID / VOLC_IMAGEX_AK / VOLC_IMAGEX_SK',
      );
    }
    const svc = imagex.defaultService;
    svc.setAccessKeyId(this.imagexAk);
    svc.setSecretKey(this.imagexSk);

    const workflowParameter = JSON.stringify({
      Input: { ObjectKey: imageUrl, DataType: 'url' },
      AiSuperResolutionParam: { Multiple: multiple },
    });

    try {
      const res = await svc.AIProcess({
        ServiceId: this.imagexServiceId,
        WorkflowTemplateId: 'system_workflow_ai_super_resolution',
        WorkflowParameter: workflowParameter,
      });
      const result = res?.Result as { Output?: string } | undefined;
      if (!result?.Output) {
        throw new Error('AIGC 超分未返回输出地址');
      }
      const output = JSON.parse(result.Output) as { ObjectKey?: string; Size?: number; Format?: string };
      return {
        image_url: output.ObjectKey || '',
        format: output.Format || 'webp',
        size: output.Size || 0,
      };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(`veImageX AIGC 超分失败: ${detail}`);
      throw new BadRequestException('AIGC 超分失败，请检查 veImageX 配置或稍后重试');
    }
  }

  /** 单次请求的超时时间（毫秒） */
  private readonly timeoutMs = 80000;

  /** 网络类错误是否应重试 */
  private isRetryable(err: unknown): boolean {
    if (err instanceof BadRequestException) return false;
    const msg = err instanceof Error ? `${err.message} ${String((err as any)?.cause ?? '')}` : '';
    // 网络中断/超时/连接重置等可重试；业务参数错误（800012 等）不可重试
    return /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|AbortError|timeout/i.test(msg);
  }

  /** 统一的 POST 请求封装：附加 Bearer 鉴权 + 超时 + 网络错误重试 */
  private async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    if (!this.isConfigured()) {
      throw new BadRequestException('火山 MediaKit 未配置，请设置 VOLC_MEDIAKIT_API_KEY');
    }

    const attempt = async (): Promise<T> => {
      const res = await fetch(`${this.baseUrl}/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      const json = (await res.json()) as any;
      if (!res.ok || json?.success === false) {
        const msg = json?.error?.message || json?.message || `火山接口错误 ${res.status}`;
        this.logger.error(`火山 ${path} 失败: ${res.status} ${msg}`);
        throw new BadRequestException(msg);
      }
      return json as T;
    };

    try {
      return await attempt();
    } catch (err) {
      // 网络类异常：记录具体原因（含 cause），并重试一次
      if (this.isRetryable(err)) {
        const detail = err instanceof Error ? `${err.message} ${String((err as any)?.cause ?? '')}` : String(err);
        this.logger.warn(`火山 ${path} 网络异常，1s 后重试: ${detail}`);
        await new Promise((r) => setTimeout(r, 1000));
        try {
          return await attempt();
        } catch (retryErr) {
          const rd = retryErr instanceof Error ? `${retryErr.message} ${String((retryErr as any)?.cause ?? '')}` : String(retryErr);
          this.logger.error(`火山 ${path} 重试仍失败: ${rd}`);
          throw new BadRequestException('调用火山服务失败，请稍后重试');
        }
      }
      if (err instanceof BadRequestException) throw err;
      const detail = err instanceof Error ? `${err.message} ${String((err as any)?.cause ?? '')}` : String(err);
      this.logger.error(`火山 ${path} 请求异常: ${detail}`);
      throw new BadRequestException('调用火山服务失败，请稍后重试');
    }
  }
}