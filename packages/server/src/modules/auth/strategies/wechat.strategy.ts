import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport';

// 微信 OAuth 策略占位（Phase 0 仅接口框架）
@Injectable()
export class WechatStrategy extends PassportStrategy(Strategy, 'wechat') {
  constructor() {
    super();
  }

  /** 微信 OAuth 验证 — Phase 0 占位 */
  async validate(...args: any[]): Promise<any> {
    // TODO: Phase 1 实现微信 OAuth 验证逻辑
    return null;
  }
}
