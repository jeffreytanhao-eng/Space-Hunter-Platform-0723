import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginPasswordDto } from './dto/login-password.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendSmsCodeDto } from './dto/send-sms-code.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '手机号+验证码注册' })
  @ApiResponse({ status: 201, description: '注册成功，返回 JWT' })
  @ApiResponse({ status: 400, description: '参数错误或手机号已注册' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.phone, dto.code);
  }

  @Post('login')
  @ApiOperation({ summary: '手机号+验证码登录' })
  @ApiResponse({ status: 200, description: '登录成功，返回 JWT' })
  @ApiResponse({ status: 400, description: '参数错误或手机号未注册' })
  @ApiResponse({ status: 401, description: '用户已被禁用' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.phone, dto.code);
  }

  @Post('login-password')
  @ApiOperation({ summary: '用户名+密码登录（管理员）' })
  @ApiResponse({ status: 200, description: '登录成功，返回 JWT' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async loginWithPassword(@Body() dto: LoginPasswordDto) {
    return this.authService.loginWithPassword(dto.username, dto.password);
  }

  @Post('wechat')
  @ApiOperation({ summary: '微信 OAuth 登录（扫码/小程序）' })
  @ApiResponse({ status: 200, description: '登录成功，返回 JWT' })
  @ApiResponse({ status: 401, description: '微信授权失败' })
  async wechatLogin(@Body() dto: WechatLoginDto) {
    return this.authService.wechatLogin(dto.code, dto.type);
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新 JWT token' })
  @ApiResponse({ status: 200, description: '刷新成功，返回新 JWT' })
  @ApiResponse({ status: 401, description: '刷新令牌无效或已过期' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.validateRefreshToken(dto.refreshToken);
  }

  @Post('sms-code')
  @ApiOperation({ summary: '发送短信验证码（开发环境固定 123456）' })
  @ApiResponse({ status: 200, description: '验证码发送成功' })
  @ApiResponse({ status: 429, description: '发送过于频繁' })
  async sendSmsCode(@Body() dto: SendSmsCodeDto) {
    return this.authService.sendSmsCode(dto.phone);
  }
}
