import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Redis 服务，封装常用操作
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      db: this.configService.get<number>('REDIS_DB', 0),
    });

    this.client.on('connect', () => {
      console.log('Redis 连接成功');
    });
    this.client.on('error', (err) => {
      console.error('Redis 连接错误:', err);
    });
  }

  /** 获取 Redis 客户端实例 */
  getClient(): Redis {
    return this.client;
  }

  /** 获取键值 */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /** 设置键值 */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  /** 删除键 */
  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  /** 设置过期时间 */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  /** 检查键是否存在 */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /** 模块销毁时关闭连接 */
  onModuleDestroy() {
    this.client.disconnect();
  }
}
