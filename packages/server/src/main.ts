import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局 CORS 配置
  app.enableCors();

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger 文档配置
  const swaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle(process.env.SWAGGER_TITLE || '太空猎人 API')
      .setDescription(
        process.env.SWAGGER_DESCRIPTION || '太空猎人天文社区平台 API 文档',
      )
      .setVersion(process.env.SWAGGER_VERSION || '0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  // 监听端口，从环境变量读取，默认 3000
  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`应用已启动，监听端口: ${port}`);
}
bootstrap();
