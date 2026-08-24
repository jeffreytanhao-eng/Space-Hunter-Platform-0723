import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../../database/entities/device.entity';

/**
 * 设备令牌守卫 — 校验 Authorization: Bearer <device_token>
 * 用于设备端上传/查询接口（Task D2/D3）
 */
@Injectable()
export class DeviceTokenGuard implements CanActivate {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers['authorization'] as string | undefined;

    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('缺少设备令牌');
    }

    const token = auth.slice(7).trim();
    const device = await this.deviceRepo.findOne({
      where: { deviceToken: token, status: 'active' },
    });

    if (!device) {
      throw new UnauthorizedException('设备令牌无效或设备未激活');
    }

    request.device = device;
    return true;
  }
}