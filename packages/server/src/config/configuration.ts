// 环境变量配置映射
export default () => ({
  // 应用配置
  app: {
    port: parseInt(process.env.APP_PORT || '3000', 10),
    env: process.env.APP_ENV || 'development',
  },
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_DATABASE || 'space_hunter',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  // 腾讯云 COS 配置
  cos: {
    secretId: process.env.COS_SECRET_ID || '',
    secretKey: process.env.COS_SECRET_KEY || '',
    bucket: process.env.COS_BUCKET || '',
    region: process.env.COS_REGION || 'ap-guangzhou',
  },
  // Swagger 配置
  swagger: {
    title: process.env.SWAGGER_TITLE || '太空猎人 API',
    description: process.env.SWAGGER_DESCRIPTION || '太空猎人天文社区平台 API 文档',
    version: process.env.SWAGGER_VERSION || '0.1.0',
    enabled: process.env.SWAGGER_ENABLED !== 'false',
  },
});
