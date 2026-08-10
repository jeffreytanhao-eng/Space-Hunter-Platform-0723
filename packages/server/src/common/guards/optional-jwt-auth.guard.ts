import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// 可选 JWT 认证守卫：携带 token 时解析当前用户，匿名请求也放行（user 为 null）
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
