import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
// bcrypt 预留：手机号登录暂不需要密码哈希，后续密码功能启用时使用
// import * as bcrypt from 'bcrypt';

// 认证服务
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /** 注册：校验验证码 → 查找用户 → 不存在则创建 → 返回 JWT */
  async register(phone: string, code: string) {
    // 校验验证码
    await this.verifySmsCode(phone, code);

    // 查找用户，已存在则报错
    const existingUser = await this.usersService.findByPhone(phone);
    if (existingUser) {
      throw new BadRequestException('该手机号已注册，请直接登录');
    }

    // 创建新用户
    const user = await this.usersService.create({
      phone,
      nickname: `星空旅人${Date.now().toString().slice(-6)}`,
      role: 'user',
      status: 'active',
    });

    // 删除已使用的验证码
    await this.redisService.del(`sms:code:${phone}`);

    return this.generateTokens(user);
  }

  /** 登录：校验验证码 → 查找用户 → 存在则登录 → 返回 JWT */
  async login(phone: string, code: string) {
    // 校验验证码
    await this.verifySmsCode(phone, code);

    // 查找用户
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new BadRequestException('该手机号未注册，请先注册');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('用户已被禁用');
    }

    // 删除已使用的验证码
    await this.redisService.del(`sms:code:${phone}`);

    return this.generateTokens(user);
  }

  /** 微信登录：通过 code 换取 openid → 查找/创建用户 → 返回 JWT */
  async wechatLogin(code: string, type: 'web' | 'miniapp') {
    // TODO: Phase 1 实际调用微信 API 获取 openid
    // 当前阶段使用 code 模拟 openid
    const openid = `wechat_${type}_${code}`;

    // 查找用户
    let user = await this.usersService.findByWechatOpenid(openid);

    if (!user) {
      // 创建新用户
      user = await this.usersService.create({
        wechatOpenid: openid,
        nickname: `微信用户${Date.now().toString().slice(-6)}`,
        role: 'user',
        status: 'active',
      });
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('用户已被禁用');
    }

    return this.generateTokens(user);
  }

  /** 根据 ID 查找用户 */
  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || user.status !== 'active') {
      return null;
    }
    return user;
  }

  /** 生成 access_token + refresh_token */
  async generateTokens(user: any) {
    const payload = { sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  /** 验证短信验证码（Redis 存储，5分钟过期） */
  async verifySmsCode(phone: string, code: string) {
    const storedCode = await this.redisService.get(`sms:code:${phone}`);
    if (!storedCode) {
      throw new BadRequestException('验证码已过期，请重新获取');
    }
    if (storedCode !== code) {
      throw new BadRequestException('验证码错误');
    }
    return true;
  }

  /** 发送短信验证码（开发环境直接存 Redis，固定 123456） */
  async sendSmsCode(phone: string) {
    const env = this.configService.get<string>('APP_ENV', 'development');
    const code = env === 'production' ? this.generateRandomCode() : '123456';

    // 存入 Redis，5 分钟过期
    await this.redisService.set(`sms:code:${phone}`, code, 300);

    if (env === 'production') {
      // TODO: 接入短信服务商发送验证码
      console.log(`[生产环境] 向 ${phone} 发送验证码: ${code}`);
    } else {
      console.log(`[开发环境] 验证码: ${code} (手机号: ${phone})`);
    }

    return { message: '验证码发送成功' };
  }

  /** 验证 refresh token */
  async validateRefreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /** 生成6位随机验证码 */
  private generateRandomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
