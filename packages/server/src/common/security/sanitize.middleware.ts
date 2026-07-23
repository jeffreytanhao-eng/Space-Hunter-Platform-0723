import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// XSS 危险模式列表
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /\bon\w+\s*=/gi, // onerror=, onclick= 等
  /<\s*iframe\b/gi,
  /<\s*object\b/gi,
  /<\s*embed\b/gi,
  /<\s*form\b/gi,
  /expression\s*\(/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
];

// 输入净化中间件：过滤 XSS 字符，递归处理 request body
@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeDeep(req.body);
    }

    // 净化 query 参数
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeDeep(req.query) as typeof req.query;
    }

    // 净化 params 参数
    if (req.params && typeof req.params === 'object') {
      req.params = this.sanitizeDeep(req.params) as typeof req.params;
    }

    next();
  }

  /** 递归净化对象 */
  private sanitizeDeep(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeDeep(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key of Object.keys(obj)) {
        // 键名也做 XSS 检测
        const cleanKey = this.sanitizeString(key);
        sanitized[cleanKey] = this.sanitizeDeep(obj[key]);
      }
      return sanitized;
    }

    return obj;
  }

  /** 净化字符串：移除 XSS 危险模式 */
  private sanitizeString(value: string): string {
    let sanitized = value;
    for (const pattern of XSS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    return sanitized;
  }
}
