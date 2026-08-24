import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { DevicesService } from './devices.service';
import { DEVICE_TASK_STREAM } from './devices.service';

/**
 * 设备处理空壳 Worker（Task D4）
 *
 * Phase0 行为：消费 Redis Stream，收到任务直接置 done（占位，等待 Phase1 真实推理）。
 * ---------------------------------------------------------------
 * 说明：
 *  - 默认不启动（DEVICE_WORKER_ENABLED !== 'true'），避免影响主链路；
 *  - 需要时在 server 进程内启用；Phase1 重构为独立容器 worker。
 *  - 用 XREAD 从最新消息轮询，任务状态以 device_processing_tasks 为准（幂等）。
 */
@Injectable()
export class DeviceWorkerService implements OnModuleInit {
  private readonly logger = new Logger(DeviceWorkerService.name);
  private running = false;

  constructor(
    private readonly redisService: RedisService,
    private readonly devicesService: DevicesService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    if (this.configService.get<string>('DEVICE_WORKER_ENABLED') === 'true') {
      this.logger.log('设备处理空壳 Worker 已启用');
      this.running = true;
      this.consume().catch((err) => {
        this.logger.error(`设备处理 Worker 异常退出: ${err?.message}`);
      });
    }
  }

  private async consume(): Promise<void> {
    const client = this.redisService.getClient();
    const group = 'device_workers';
    const consumer = `worker-${process.pid}`;

    // 创建消费者组（已存在则忽略 BUSYGROUP），从 0 开始以便处理存量消息
    try {
      await client.xgroup('CREATE', DEVICE_TASK_STREAM, group, '0', 'MKSTREAM');
    } catch (err: any) {
      if (!/BUSYGROUP/i.test(String(err?.message || err))) {
        throw err;
      }
    }

    while (this.running) {
      let result: any = null;
      try {
        result = await client.xreadgroup(
          'GROUP', group, consumer,
          'COUNT', 1,
          'BLOCK', 5000,
          'STREAMS', DEVICE_TASK_STREAM, '>',
        );
      } catch (err) {
        this.logger.error(`XREADGROUP 失败: ${(err as Error)?.message}`);
        await this.sleep(2000);
        continue;
      }

      if (!result) continue; // 超时无新消息

      for (const [, entries] of result as any[]) {
        for (const [id, fields] of entries as any[]) {
          const record: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            record[fields[i]] = fields[i + 1];
          }
          try {
            // Phase0 空壳：直接视为处理完成
            await this.devicesService.completeProcessing({
              uploadId: record.uploadId,
              type: record.type,
              status: 'done',
              result: { worker: 'phase0-stub' },
            });
            await client.xack(DEVICE_TASK_STREAM, group, id);
          } catch (err) {
            this.logger.error(`任务处理失败(仍ack防重): upload=${record.uploadId}, ${(err as Error)?.message}`);
            await client.xack(DEVICE_TASK_STREAM, group, id);
          }
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}