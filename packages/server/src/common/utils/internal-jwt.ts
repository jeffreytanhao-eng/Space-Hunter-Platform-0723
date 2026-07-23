import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

/** 内部服务 JWT 的 payload 结构 */
interface InternalJwtPayload {
  iss: string;
  scope: string;
  iat?: number;
  exp?: number;
}

/**
 * 生成内部服务 JWT
 * 用于 Worker 回调等内部服务间认证
 */
export function generateInternalToken(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET', 'default-secret');
  const payload: InternalJwtPayload = {
    iss: 'fits-worker',
    scope: 'fits-callback',
  };

  return jwt.sign(payload, secret, { expiresIn: '5m' });
}

/**
 * 验证内部服务 JWT
 * 返回解码后的 payload，验证失败抛出异常
 */
export function verifyInternalToken(
  token: string,
  configService: ConfigService,
): InternalJwtPayload {
  const secret = configService.get<string>('JWT_SECRET', 'default-secret');

  const decoded = jwt.verify(token, secret) as InternalJwtPayload;

  // 校验签发者和权限范围
  if (decoded.iss !== 'fits-worker' || decoded.scope !== 'fits-callback') {
    throw new Error('无效的内部令牌');
  }

  return decoded;
}
