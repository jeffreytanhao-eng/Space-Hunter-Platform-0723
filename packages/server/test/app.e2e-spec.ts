import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('AppController (e2e) - 健康检查', () => {
  let app: INestApplication;
  let appController: AppController;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    appController = moduleFixture.get<AppController>(AppController);
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  // 健康检查接口返回 status: ok
  it('GET / 应返回 status: ok', () => {
    const result = appController.getHealth();
    expect(result.status).toBe('ok');
  });

  // 健康检查接口返回正确消息
  it('GET / 应包含 message 字段', () => {
    const result = appController.getHealth();
    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe('string');
  });

  // 健康检查接口返回时间戳
  it('GET / 应包含 timestamp 字段', () => {
    const result = appController.getHealth();
    expect(result.timestamp).toBeDefined();
    // 验证是合法的 ISO 时间字符串
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  // 应用实例应正确创建
  it('应用实例应正确创建', () => {
    expect(app).toBeDefined();
  });
});
