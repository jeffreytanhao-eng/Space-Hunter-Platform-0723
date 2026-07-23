import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let redisService: RedisService;

  // Mock 用户数据
  const mockUser = {
    id: '1',
    phone: '13800138000',
    nickname: '测试用户',
    avatar: null,
    role: 'user',
    status: 'active',
    pointsBalance: '0',
  };

  // Mock UsersService
  const mockUsersService = {
    findByPhone: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };

  // Mock JwtService
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn(),
  };

  // Mock RedisService
  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    redisService = module.get<RedisService>(RedisService);

    // 重置所有 mock
    jest.clearAllMocks();
  });

  describe('register', () => {
    // 新用户注册成功
    it('新用户注册成功', async () => {
      mockRedisService.get.mockResolvedValue('123456');
      mockUsersService.findByPhone.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-access-token');
      mockConfigService.get.mockReturnValue('7d');

      const result = await service.register('13800138000', '123456');

      // 验证创建用户被调用
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '13800138000' }),
      );
      // 验证验证码被删除
      expect(mockRedisService.del).toHaveBeenCalledWith('sms:code:13800138000');
      // 验证返回 JWT
      expect(result.access_token).toBe('mock-access-token');
      expect(result.user.nickname).toBe('测试用户');
    });

    // 已有用户注册时应抛出异常
    it('已有用户注册时应抛出 BadRequestException', async () => {
      mockRedisService.get.mockResolvedValue('123456');
      mockUsersService.findByPhone.mockResolvedValue(mockUser);

      await expect(service.register('13800138000', '123456')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register('13800138000', '123456')).rejects.toThrow(
        '该手机号已注册，请直接登录',
      );
    });
  });

  describe('login', () => {
    // 验证码错误
    it('验证码错误时应抛出 BadRequestException', async () => {
      mockRedisService.get.mockResolvedValue('654321');

      await expect(service.login('13800138000', '123456')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login('13800138000', '123456')).rejects.toThrow(
        '验证码错误',
      );
    });

    // 登录成功返回 JWT
    it('登录成功返回 JWT', async () => {
      mockRedisService.get.mockResolvedValue('123456');
      mockUsersService.findByPhone.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-login-token');
      mockConfigService.get.mockReturnValue('7d');

      const result = await service.login('13800138000', '123456');

      expect(result.access_token).toBe('mock-login-token');
      expect(result.refresh_token).toBe('mock-login-token');
      expect(result.user.id).toBe('1');
      // 验证验证码被删除
      expect(mockRedisService.del).toHaveBeenCalledWith('sms:code:13800138000');
    });

    // 用户被禁用
    it('用户被禁用时应抛出 UnauthorizedException', async () => {
      mockRedisService.get.mockResolvedValue('123456');
      mockUsersService.findByPhone.mockResolvedValue({
        ...mockUser,
        status: 'banned',
      });

      await expect(service.login('13800138000', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('sendSmsCode', () => {
    // 开发环境固定验证码 123456
    it('开发环境应生成固定验证码 123456', async () => {
      mockConfigService.get.mockReturnValue('development');

      const result = await service.sendSmsCode('13800138000');

      // 验证存入 Redis 的验证码为 123456
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'sms:code:13800138000',
        '123456',
        300,
      );
      expect(result.message).toBe('验证码发送成功');
    });

    // 生产环境应生成随机验证码
    it('生产环境应生成随机验证码', async () => {
      mockConfigService.get.mockReturnValue('production');

      await service.sendSmsCode('13800138000');

      // 验证存入 Redis 的验证码不是固定值
      const setCall = mockRedisService.set.mock.calls[0];
      expect(setCall[1]).not.toBe('123456');
      // 验证码应为 6 位数字
      expect(setCall[1]).toMatch(/^\d{6}$/);
    });
  });
});
