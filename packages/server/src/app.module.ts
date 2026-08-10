import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { SectionsModule } from './modules/sections/sections.module';
import { CommentsModule } from './modules/comments/comments.module';
import { PointsModule } from './modules/points/points.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { FollowsModule } from './modules/follows/follows.module';
import { EventsModule } from './modules/events/events.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadModule } from './modules/upload/upload.module';
import { FitsModule } from './modules/fits/fits.module';
import { AdsModule } from './modules/ads/ads.module';
import { VolcModule } from './modules/volc/volc.module';
import { CsrfMiddleware } from './common/security/csrf.middleware';
import { RateLimitMiddleware } from './common/security/rate-limit.middleware';
import { SanitizeMiddleware } from './common/security/sanitize.middleware';

@Module({
  imports: [
    // 环境变量配置
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    // 应用配置模块
    AppConfigModule,
    // 数据库模块
    DatabaseModule,
    // Redis 模块（全局）
    RedisModule,
    // 业务模块
    AuthModule,
    UsersModule,
    PostsModule,
    SectionsModule,
    CommentsModule,
    PointsModule,
    GalleryModule,
    FollowsModule,
    EventsModule,
    AdminModule,
    UploadModule,
    FitsModule,
    AdsModule,
    VolcModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      // 输入净化：最先执行，确保后续中间件拿到干净数据
      .apply(SanitizeMiddleware)
      .forRoutes('*')
      // CSRF 防护
      .apply(CsrfMiddleware)
      .forRoutes('*')
      // 限流
      .apply(RateLimitMiddleware)
      .forRoutes('*');
  }
}
