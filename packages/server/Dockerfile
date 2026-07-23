# 太空猎人 - NestJS 后端服务 Dockerfile
# 多阶段构建：编译阶段 + 生产运行阶段

# ============ 阶段1: 编译阶段 ============
FROM node:18-alpine AS builder

WORKDIR /app

# 先复制依赖声明文件，利用 Docker 缓存层加速构建
COPY package.json package-lock.json* ./

# 安装全部依赖（含 devDependencies，编译所需）
RUN npm ci

# 复制源代码和配置文件
COPY . .

# 编译 TypeScript → JavaScript
RUN npm run build

# ============ 阶段2: 生产运行阶段 ============
FROM node:18-alpine AS production

WORKDIR /app

# 设置生产环境变量
ENV NODE_ENV=production

# 先复制依赖声明文件
COPY package.json package-lock.json* ./

# 仅安装生产依赖（排除 devDependencies）
RUN npm ci --only=production && \
    npm cache clean --force

# 从编译阶段复制编译产物
COPY --from=builder /app/dist ./dist

# 暴露服务端口
EXPOSE 3000

# 健康检查：每 30 秒检测一次服务是否可用
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# 以非 root 用户运行（安全最佳实践）
USER node

# 启动生产服务
CMD ["node", "dist/main.js"]
