# 太空猎人 Space Hunter

天文社区平台 — 天文爱好者的交流、分享与探索空间。

## 项目架构

Monorepo 架构，包含四个核心包：

```
packages/
├── server/          # NestJS 后端服务
├── web/             # Next.js 14 前端
├── miniapp/         # Taro 4 微信小程序
├── server-fits/     # Python FastAPI FITS 处理 Worker
└── shared/          # 共享 TypeScript 类型
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | NestJS 10 + TypeORM + PostgreSQL 15 + Redis 7 |
| 认证 | JWT + Passport + 短信验证码 + 微信登录 |
| 前端 | Next.js 14 App Router + React 18 + Tailwind CSS |
| 小程序 | Taro 4 + React 18（微信小程序） |
| FITS 处理 | Python FastAPI + astropy + Pillow + numpy |
| 部署 | Docker Compose（6 服务编排）+ Nginx 反向代理 |
| 对象存储 | 腾讯云 COS（图片 + FITS 文件） |
| 知识图谱 | graphify（代码库结构可视化） |

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL 15
- Redis 7
- Python 3.11（仅 FITS Worker）

### 安装

```bash
# 安装所有依赖
npm install --legacy-peer-deps

# 配置环境变量
cp packages/server/.env.example packages/server/.env
cp packages/web/.env.example packages/web/.env
```

### 开发

```bash
# 后端开发（热重载）
npm run dev:server

# 前端开发（热重载）
npm run dev:web

# 小程序开发
npm run dev:miniapp
```

### 测试

```bash
# 后端单元测试
npm run test -w packages/server

# 构建
npm run build
```

## 项目结构

```
.
├── docker/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   ├── conf.d/default.conf
│   │   └── ssl/
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
├── packages/
│   ├── server/                     # NestJS 后端
│   │   └── src/
│   │       ├── modules/            # 13 个业务模块
│   │       ├── common/             # 通用组件
│   │       └── database/           # 数据库实体/迁移/种子
│   ├── web/                        # Next.js 14 前端
│   │   └── src/
│   │       ├── app/                # 页面路由
│   │       ├── components/         # UI 组件
│   │       ├── services/           # API 服务
│   │       └── stores/             # 状态管理
│   ├── miniapp/                    # Taro 微信小程序
│   ├── server-fits/                # Python FITS 处理
│   └── shared/                     # 共享类型
├── graphify-out/                   # 知识图谱
├── .trae/specs/                    # 开发规格文档
├── docker-compose.yml
└── package.json
```

## Docker 部署

```bash
# 开发环境
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# 生产环境
docker compose up -d
```

6 服务编排：nginx（反向代理）→ backend（NestJS）→ web（Next.js）→ postgres（数据库）→ redis（缓存）→ fits-worker（FITS 处理）

## 架构决策

| ADR | 决策 |
|-----|------|
| ADR-004 | 内容审核：规则预过滤 + 人工终审 |
| ADR-006 | 积分并发：事务 + 行锁 + Redis 分布式锁 + 幂等键 |
| ADR-007 | Admin 与用户端同站隔离（/admin/* 路由组） |
| ADR-008 | 小程序发帖实时可见（列表缓存 30s / CDN 60s） |

## 知识图谱

项目包含完整的代码库知识图谱，由 graphify 自动生成：

```bash
# 交互式图谱（浏览器打开）
graphify-out/graph.html

# 完整报告
graphify-out/GRAPH_REPORT.md
```

图谱包含 1101 个节点、2110 条边、107 个社区，post-commit hook 会在每次提交后自动更新。

## 版权声明

All Rights Reserved. 未经授权，不得用于任何商业用途。
