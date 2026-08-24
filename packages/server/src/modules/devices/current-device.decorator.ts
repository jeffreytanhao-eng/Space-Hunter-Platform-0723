import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 获取当前设备（由 DeviceTokenGuard 挂载到 request.device）
 */
export const CurrentDevice = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.device;
  },
);