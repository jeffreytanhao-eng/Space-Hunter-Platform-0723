import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// CSRF 防护中间件：校验 Origin/Referer 头，防止跨站请求伪造
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 仅对状态变更方法进行校验
    const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!unsafeMethods.includes(req.method.toUpperCase())) {
      return next();
    }

    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    const host = req.headers.host || '';

    // 允许无 Origin/Referer 的请求通过（如 Postman、服务端调用）
    // 但对 Admin 写操作强制校验
    const isAdminWrite = req.path.startsWith('/admin') && unsafeMethods.includes(req.method.toUpperCase());

    if (isAdminWrite) {
      // Admin 写操作强制 SameSite=strict：必须携带合法 Origin
      if (!origin && !referer) {
        throw new ForbiddenException('管理操作缺少 Origin/Referer 头');
      }
    }

    // 如果提供了 Origin 或 Referer，则校验其与 host 匹配
    if (origin) {
      if (!this.isSameOrigin(origin, host)) {
        throw new ForbiddenException('CSRF 校验失败：Origin 不匹配');
      }
    } else if (referer) {
      if (!this.isSameReferer(referer, host)) {
        throw new ForbiddenException('CSRF 校验失败：Referer 不匹配');
      }
    }

    next();
  }

  /** 校验 Origin 是否与 host 同源 */
  private isSameOrigin(origin: string, host: string): boolean {
    try {
      const url = new URL(origin);
      return url.host === host;
    } catch {
      return false;
    }
  }

  /** 校验 Referer 是否与 host 同源 */
  private isSameReferer(referer: string, host: string): boolean {
    try {
      const url = new URL(referer);
      return url.host === host;
    } catch {
      return false;
    }
  }
}
