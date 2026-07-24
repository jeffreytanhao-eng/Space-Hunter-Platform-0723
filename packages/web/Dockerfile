﻿﻿﻿﻿# 太空猎人 - Next.js 前端服务 Dockerfile
# 三阶段构建：依赖安装 → 构建 → 精简运行

# ============ 阶段1: 依赖安装 ============
FROM node:18-alpine AS deps

WORKDIR /app

# 先复制依赖声明文件，利用 Docker 缓存层
COPY package.json package-lock.json* ./

# 安装全部依赖
RUN npm ci

# ============ 阶段2: 构建阶段 ============
FROM node:18-alpine AS builder

WORKDIR /app

# 从 deps 阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码和配置文件
COPY . .

# 设置构建时环境变量
ENV NEXT_TELEMETRY_DISABLED=1

# 构建时注入 NEXT_PUBLIC_API_BASE（Next.js 需要在编译阶段内联到客户端 JS）
ARG NEXT_PUBLIC_API_BASE=http://backend:3000/api
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE

# 构建 Next.js 生产产物
RUN npm run build

# ============ 阶段3: 运行阶段 ============
FROM node:18-alpine AS runner

WORKDIR /app

# 设置生产环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 以非 root 用户运行（安全最佳实践）
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# 从构建阶段复制 Next.js 必要文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 暴露服务端口
EXPOSE 3001

# 设置端口环境变量
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# 健康检查：每 30 秒检测一次服务是否可用
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# 启动 Next.js 服务（standalone 模式）
CMD ["node", "server.js"]
