import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 短信验证码服务
 *
 * 集成 spacemapper.cn 短信验证码 API：
 * - 发送验证码：POST /cgi/spi/sms/send
 * - 验证验证码：POST /cgi/spi/sms/validate
 *
 * 供应商负责生成验证码并发送到用户手机，验证时也由供应商校验。
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly baseUrl: string;
  private readonly appId: string;
  private readonly appKey: string;
  private readonly appSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'SMS_BASE_URL',
      'https://spacemapper.cn',
    );
    this.appId = this.configService.get<string>('SMS_APP_ID', '');
    this.appKey = this.configService.get<string>('SMS_APP_KEY', '');
    this.appSecret = this.configService.get<string>('SMS_APP_SECRET', '');
  }

  /** 检查 SMS 配置是否完整 */
  isConfigured(): boolean {
    return !!(this.appId && this.appKey && this.appSecret);
  }

  /**
   * 发送短信验证码
   * 供应商生成验证码并发送到用户手机
   */
  async sendCode(mobile: string): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.error('短信服务未配置，请检查 SMS_APP_ID / SMS_APP_KEY / SMS_APP_SECRET 环境变量');
      throw new BadRequestException('短信服务未配置');
    }

    try {
      const response = await fetch(`${this.baseUrl}/cgi/spi/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: Number(this.appId),
          appKey: this.appKey,
          appSecret: this.appSecret,
          mobile,
        }),
      });

      const result = (await response.json()) as {
        code: number;
        data: string;
        msg: string;
      };

      if (result.code !== 0) {
        this.logger.error(`短信发送失败: code=${result.code}, msg=${result.msg}, mobile=${mobile}`);
        throw new BadRequestException(result.msg || '短信发送失败');
      }

      this.logger.log(`短信验证码发送成功: ${mobile}`);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`短信发送网络异常: ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException('短信发送失败，请稍后重试');
    }
  }

  /**
   * 验证短信验证码
   * 由供应商校验验证码是否正确
   * @returns true=验证通过
   */
  async validateCode(mobile: string, code: string): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.error('短信服务未配置，请检查 SMS_APP_ID / SMS_APP_KEY / SMS_APP_SECRET 环境变量');
      throw new BadRequestException('短信服务未配置');
    }

    try {
      const response = await fetch(`${this.baseUrl}/cgi/spi/sms/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: Number(this.appId),
          appKey: this.appKey,
          appSecret: this.appSecret,
          mobile,
          code,
        }),
      });

      const result = (await response.json()) as {
        code: number;
        data: boolean;
        msg: string;
      };

      if (result.code !== 0) {
        this.logger.error(`验证码校验失败: code=${result.code}, msg=${result.msg}, mobile=${mobile}`);
        throw new BadRequestException(result.msg || '验证码校验失败');
      }

      return result.data === true;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`验证码校验网络异常: ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException('验证码校验失败，请稍后重试');
    }
  }
}
