import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Device } from '../../database/entities/device.entity';
import { DeviceUpload } from '../../database/entities/device-upload.entity';
import { DeviceProcessingTask } from '../../database/entities/device-processing-task.entity';
import { CosService } from '../upload/cos.service';
import { RedisService } from '../redis/redis.service';
import { PointsService } from '../points/points.service';
import { ConfigService } from '@nestjs/config';
import { BindDeviceDto, DeviceUploadBodyDto, ProcessingCallbackDto } from './dto/devices.dto';

/** 设备处理任务类型（对应 device_processing_tasks.type） */
export const DEVICE_TASK_TYPES = [
  'ai_detect',
  'ai_classify',
  'ai_score',
  'ai_enhance',
  'fits_process',
] as const;

/** Redis 处理队列流名（外部 worker 可 XREAD 消费） */
export const DEVICE_TASK_STREAM = 'device:tasks';

/** 文件类型对应的默认处理任务 */
const DEFAULT_TASKS_BY_TYPE: Record<string, string[]> = {
  fits: ['fits_process'],
  image: ['ai_enhance'],
  raw: [],
};

const ALLOWED_FILE_TYPES = ['fits', 'image', 'raw'];

/**
 * 设备模块核心服务（Task D1–D4）
 */
@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(DeviceUpload)
    private readonly uploadRepo: Repository<DeviceUpload>,
    @InjectRepository(DeviceProcessingTask)
    private readonly taskRepo: Repository<DeviceProcessingTask>,
    private readonly cosService: CosService,
    private readonly redisService: RedisService,
    private readonly pointsService: PointsService,
    private readonly configService: ConfigService,
  ) {}

  // ===== Task D2：设备绑定 / 解绑 / 查询 =====

  /** 绑定设备（一人一机）：生成 device_token，返回给用户配置到固件 */
  async bind(userId: string, dto: BindDeviceDto) {
    if (!dto?.hardwareId?.trim()) {
      throw new BadRequestException('缺少硬件标识 hardwareId');
    }
    const hardwareId = dto.hardwareId.trim();

    // 该用户是否已绑定激活设备
    const existingForUser = await this.deviceRepo.findOne({
      where: { userId, status: 'active' },
    });
    if (existingForUser) {
      throw new BadRequestException('当前账号已绑定设备，请先解绑');
    }

    // 该硬件是否被其他激活用户占用
    const occupied = await this.deviceRepo.findOne({
      where: { hardwareId, status: 'active' },
    });
    if (occupied) {
      throw new BadRequestException('该设备已被其他账号绑定');
    }

    const token = randomUUID().replace(/-/g, '');
    const device = this.deviceRepo.create({
      userId,
      hardwareId,
      deviceToken: token,
      name: dto.name?.trim() || null,
      status: 'active',
    });
    await this.deviceRepo.save(device);

    this.logger.log(`设备已绑定: deviceId=${device.id}, userId=${userId}`);
    return { deviceId: device.id, deviceToken: token };
  }

  /** 解绑设备：置为 inactive 并吊销令牌 */
  async unbind(userId: string) {
    const device = await this.deviceRepo.findOne({
      where: { userId, status: 'active' },
    });
    if (!device) {
      throw new NotFoundException('未找到可解绑的设备');
    }
    device.status = 'inactive';
    device.deviceToken = '';
    await this.deviceRepo.save(device);
    return { success: true };
  }

  /** 查询当前账号绑定的设备（含 device_token，供用户配置固件） */
  async me(userId: string) {
    const device = await this.deviceRepo.findOne({
      where: { userId, status: 'active' },
    });
    if (!device) {
      return null;
    }
    return {
      deviceId: device.id,
      hardwareId: device.hardwareId,
      name: device.name,
      deviceToken: device.deviceToken,
      lastUploadAt: device.lastUploadAt,
    };
  }

  // ===== Task D3：设备上传 / 查询 =====

  /**
   * 设备上传（设备令牌鉴权）
   * 落库 device_uploads + 按类型建处理任务并入 Redis Stream
   */
  async upload(device: Device, file: Express.Multer.File, body: DeviceUploadBodyDto) {
    if (!file?.buffer) {
      throw new BadRequestException('未提供文件内容');
    }
    const fileType = body?.fileType?.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      throw new BadRequestException(`不支持的文件类型: ${fileType}，允许: ${ALLOWED_FILE_TYPES.join(', ')}`);
    }

    // 存对象存储（COS / 本地降级）
    const ext = this.getExtension(file.originalname);
    const key = `devices/${device.userId}/${device.hardwareId}/${randomUUID().replace(/-/g, '')}.${ext}`;
    const fileUrl = await this.cosService.uploadBuffer(file.buffer, key);

    // 落库上传记录
    const upload = this.uploadRepo.create({
      deviceId: device.id,
      userId: device.userId,
      fileUrl,
      fileType,
      metadata: body?.metadata ?? null,
      status: 'pending',
    });
    const saved = await this.uploadRepo.save(upload);

    // 计算并创建处理任务 + 入队
    const types = this.resolveTaskTypes(fileType, body?.types);
    const taskIds: string[] = [];
    const client = this.redisService.getClient();
    for (const type of types) {
      const task = await this.taskRepo.save(
        this.taskRepo.create({ uploadId: saved.id, type, status: 'pending' }),
      );
      taskIds.push(task.id);
      await client.xadd(
        DEVICE_TASK_STREAM,
        '*',
        'taskId', task.id,
        'uploadId', saved.id,
        'userId', device.userId,
        'type', type,
        'fileUrl', fileUrl,
        'fileType', fileType,
      );
    }
    this.logger.log(`设备上传入队: uploadId=${saved.id}, types=${types.join(',')}`);

    // 更新设备最近上传时间
    device.lastUploadAt = new Date();
    await this.deviceRepo.save(device);

    return {
      uploadId: saved.id,
      url: fileUrl,
      fileType,
      status: 'pending',
      tasks: taskIds,
    };
  }

  /** 用户侧：分页查询我的设备上传记录 */
  async getUserUploads(userId: string, page = 1, pageSize = 20) {
    const [items, total] = await this.uploadRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: { processingTasks: true },
    });
    return { items, total, page, pageSize };
  }

  /** 设备侧：分页查询本设备的上传记录 */
  async getDeviceUploads(device: Device, page = 1, pageSize = 20) {
    const [items, total] = await this.uploadRepo.findAndCount({
      where: { deviceId: device.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: { processingTasks: true },
    });
    return { items, total, page, pageSize };
  }

  /** 查询某条上传的处理任务（校验归属） */
  async getUploadTasks(targetId: string, scope: { userId?: string; device?: Device }) {
    const upload = await this.uploadRepo.findOne({ where: { id: targetId } });
    if (!upload) {
      throw new NotFoundException('上传记录不存在');
    }
    if (scope.device && scope.device.id !== upload.deviceId) {
      throw new NotFoundException('上传记录不存在');
    }
    if (scope.userId && scope.userId !== upload.userId) {
      throw new ForbiddenException('无权访问该上传记录');
    }
    const tasks = await this.taskRepo.find({
      where: { uploadId: targetId },
      order: { createdAt: 'ASC' },
    });
    return tasks;
  }

  // ===== Task D4：处理回调 + 积分 + 空壳 worker 支持 =====

  /**
   * 处理完成回调：更新任务状态；该上传全部完成后更新上传状态并触发积分
   * 由 /internal/processing/callback 或进程内 worker 调用
   */
  async completeProcessing(dto: ProcessingCallbackDto) {
    const task = await this.taskRepo.findOne({
      where: { uploadId: dto.uploadId, type: dto.type },
    });
    if (!task) {
      this.logger.warn(`回调未知任务: uploadId=${dto.uploadId}, type=${dto.type}`);
      return { success: true };
    }
    if (task.status === 'done' || task.status === 'failed') {
      return { success: true }; // 已终结，幂等
    }

    task.status = dto.status;
    task.result = dto.result ?? null;
    task.error = dto.error ?? null;
    task.finishedAt = new Date();
    await this.taskRepo.save(task);

    // 该上传的全部任务是否已终结 → 更新上传状态
    const remaining = await this.taskRepo.count({
      where: { uploadId: dto.uploadId, status: 'pending' },
    });
    const failed = await this.taskRepo.count({
      where: { uploadId: dto.uploadId, status: 'failed' },
    });
    const upload = await this.uploadRepo.findOne({ where: { id: dto.uploadId } });
    if (upload && remaining === 0) {
      upload.status = failed > 0 ? 'failed' : 'done';
      await this.uploadRepo.save(upload);
      // 上传全部处理成功 → 触发积分（Phase0 默认可关闭）
      await this.grantUploadPoints(upload);
    }

    return { success: true };
  }

  /** 积分触发（Task D4）：预留触发点，仅在上传全流程完成时调用 */
  private async grantUploadPoints(upload: DeviceUpload): Promise<void> {
    if (this.configService.get<string>('DEVICE_POINTS_ENABLED') !== 'true') return;
    const points = Number(this.configService.get<string>('DEVICE_UPLOAD_POINTS', '0'));
    if (!points || points <= 0) return;

    await this.pointsService.earnPoints(
      upload.userId,
      points,
      'device_upload',
      upload.id,
      `device_upload:${upload.id}`,
      '设备上传完成',
    );
    this.logger.log(`设备上传积分已发放: userId=${upload.userId}, points=${points}`);
  }

  // ===== 工具方法 =====

  private resolveTaskTypes(fileType: string, typesParam?: string): string[] {
    if (typesParam?.trim()) {
      const requested = typesParam
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const invalid = requested.filter((t) => !DEVICE_TASK_TYPES.includes(t as any));
      if (invalid.length) {
        throw new BadRequestException(`不支持的处理类型: ${invalid.join(',')}`);
      }
      return [...new Set(requested)];
    }
    return DEFAULT_TASKS_BY_TYPE[fileType] ?? [];
  }

  private getExtension(filename: string): string {
    const parts = (filename || '').split('.');
    if (parts.length < 2) return 'bin';
    return parts[parts.length - 1].toLowerCase() || 'bin';
  }
}