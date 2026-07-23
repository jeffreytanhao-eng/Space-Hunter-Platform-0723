import { Injectable, NestMiddleware, HttpException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../modules/redis/redis.service';

// 限流配置
interface RateLimitConfig {
  /** 时间窗口（秒） */
  windowMs: number;
  /** 窗口内最大请求数 */
  maxRequests: number;
}

// 默认限流配置：60 次/分钟
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60,
  maxRequests: 60,
};

// 特殊路由限流配置
const ROUTE_CONFIGS: { pattern: RegExp; config: RateLimitConfig }[] = [
  // 登录接口：5 次/分钟
  { pattern: /\/auth\/login/, config: { windowMs: 60, maxRequests: 5 } },
  // 发送验证码接口：5 次/分钟
  { pattern: /\/auth\/sms-code/, config: { windowMs: 60, maxRequests: 5 } },
  // 上传接口：10 次/分钟
  { pattern: /\/upload/, config: { windowMs: 60, maxRequests: 10 } },
];

// 简易限流中间件：基于 Redis 计数（IP + 路径）
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const path = req.originalUrl || req.url;

    // 查找匹配的限流配置
    const matched = ROUTE_CONFIGS.find((r) => r.pattern.test(path));
    const config = matched?.config ?? DEFAULT_CONFIG;

    const key = `rate-limit:${ip}:${path}`;

    // 获取当前计数
    const current = await this.redisService.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= config.maxRequests) {
      throw new HttpException('请求过于频繁，请稍后再试', 429);
    }

    // 递增计数
    if (count === 0) {
      // 首次请求：设置计数并设置过期时间
      await this.redisService.set(key, '1', config.windowMs);
    } else {
      // 后续请求：仅递增，不重置过期时间
      const client = this.redisService.getClient();
      await client.incr(key);
    }

    next();
  }
}
