# Space Hunter 阿里云部署方案 v1.0

**项目名称**：Space Hunter 天文社区
**文档类型**：部署方案
**版本**：v1.0
**日期**：2026-07-22
**适用范围**：Phase 0 论坛主体上线 + 后续设备模块全量部署演进
**云厂商**：阿里云全家桶

---

## 1. 总体部署策略

采用**分阶段演进**策略，Phase 0 单机起步，随设备模块接入和用户增长水平扩展，避免初期过度投资。

| 阶段 | 目标 | 核心架构 | 预估月成本 |
|---|---|---|---|
| Phase 0 | 论坛主体上线 | 单机 4核8G + OSS + CDN | ~¥200-400 |
| Phase 0+ | 接入设备模块预留接口 | 同 Phase 0，无新增 | 同上 |
| Phase 1 | 设备 AI/FITS 处理上线 | 应用机 + GPU 计算机分离 | ~¥1500-4000 |
| Phase 2 | 用户量增长扩容 | 多机 + RDS + SLB | ~¥3000-8000 |

> 成本为粗略估算，按量/包年差异大，实际以阿里云计费为准。

---

## 2. Phase 0 部署方案（论坛主体）

### 2.1 资源清单

| 组件 | 规格 | 用途 |
|---|---|---|
| 轻量应用服务器 / ECS | 4核 8G, 100GB SSD, 5Mbps 带宽 | 全部应用容器 |
| OSS | 标准型 bucket | 图片存储 |
| CDN | 按流量计费 | 图片加速 |
| 短信服务 | 按条计费 | 注册验证码 |
| SSL 证书 | 免费 DV | HTTPS |
| 云解析 DNS | 免费版 | 域名解析 |

### 2.2 单机架构

```
┌──────────────────────────────────────┐
│     阿里云 ECS / 轻量 4核 8G         │
│  ┌────────────────────────────────┐  │
│  │           Nginx                │  │
│  │   (80/443 反向代理 + HTTPS)    │  │
│  └────────────┬───────────────────┘  │
│  ┌────────────┴───────────────────┐  │
│  │          Docker                │  │
│  │  ┌──────────┐  ┌────────────┐  │  │
│  │  │ backend  │  │    web     │  │  │
│  │  │(NestJS)  │  │ (Next.js)  │  │  │
│  │  └────┬─────┘  └────────────┘  │  │
│  │  ┌────┴─────┐  ┌────────────┐  │  │
│  │  │postgres  │  │   redis    │  │  │
│  │  │   15     │  │     7       │  │  │
│  │  └──────────┘  └────────────┘  │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
         │                │
         ▼                ▼
   ┌──────────┐     ┌──────────┐
   │   OSS    │     │   CDN    │
   │ (图片)   │────▶│ (加速)   │
   └──────────┘     └──────────┘
```

### 2.3 docker-compose 编排（推荐）

```yaml
version: "3.9"
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/certs:/etc/nginx/certs
      - ./nginx/logs:/var/log/nginx
    depends_on: [backend, web]
    restart: always

  backend:
    build: ./backend
    env_file: .env
    expose: ["3000"]
    restart: always

  web:
    build: ./web
    env_file: .env
    expose: ["3001"]
    restart: always

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: spacehunter
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    expose: ["5432"]
    restart: always

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redisdata:/data
    expose: ["6379"]
    restart: always

volumes:
  pgdata:
  redisdata:
```

### 2.4 Nginx 反向代理要点

```nginx
# HTTP → HTTPS 强制跳转
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

# 网页前端
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_pass http://web:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2.5 环境变量清单（.env）

```env
# 数据库
DB_HOST=postgres
DB_PORT=5432
DB_USER=spacehunter
DB_PASSWORD=<强密码>
DB_NAME=spacehunter

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<强密码>

# JWT
JWT_SECRET=<随机长字符串>
JWT_EXPIRES_IN=7d

# 阿里云 OSS
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=spacehunter-images
OSS_ACCESS_KEY_ID=<AK>
OSS_ACCESS_KEY_SECRET=<SK>

# 阿里云短信
SMS_ACCESS_KEY_ID=<AK>
SMS_ACCESS_KEY_SECRET=<SK>
SMS_SIGN_NAME=SpaceHunter
SMS_TEMPLATE_CODE=<模板Code>

# 微信 OAuth
WECHAT_APP_ID=<AppID>
WECHAT_APP_SECRET=<AppSecret>

# 前端
NEXT_PUBLIC_API_BASE=https://yourdomain.com/api
NEXT_PUBLIC_OSS_BASE=https://spacehunter-images.oss-cn-hangzhou.aliyuncs.com
```

### 2.6 Phase 0 上线 Checklist

- [ ] 域名已购买并完成 **ICP 备案**（关键，7-20 工作日）
- [ ] SSL 证书已申请并部署
- [ ] DNS 解析已配置（A 记录指向 ECS 公网 IP）
- [ ] ECS 安全组：开放 80/443，关闭 5432/6379 公网
- [ ] OSS bucket 已创建，**CORS 已配置**（允许网页域名直传）
- [ ] 短信签名 + 模板已审核通过
- [ ] 微信 OAuth 已配置回调域名
- [ ] 数据库强密码 + 定期备份 cron
- [ ] Docker 镜像使用固定版本 tag，不用 latest
- [ ] 日志目录已挂载持久化卷
- [ ] 健康检查接口 `/api/health` 可访问

### 2.7 备份策略

```bash
# 每日凌晨 3 点全量备份 PG，保留 7 天
0 3 * * * docker exec postgres pg_dump -U spacehunter spacehunter | gzip > /backup/pg_$(date +\%Y\%m\%d).sql.gz && find /backup -mtime +7 -delete
```

OSS 开启版本控制 + 跨区域复制（关键图片）。

---

## 3. Phase 1 部署方案（接入设备模块处理）

### 3.1 资源清单（在 Phase 0 基础上新增）

| 组件 | 规格 | 用途 |
|---|---|---|
| GPU 计算服务器 | ECS gn7i 系列，T4 16G 显存, 8核 16G | AI 推理 + FITS 处理 + 渲染 |
| 阿里云 IoT Hub | 按量计费 | 设备接入与消息路由 |
| OSS 第二 bucket | 标准型 | 设备原始文件存储 |
| OSS 第三 bucket | 标准型 | 处理结果文件存储 |

### 3.2 双机架构

```
┌──────────────────────────────┐   ┌──────────────────────────────┐
│   应用服务器 (沿用 Phase 0)  │   │     GPU 计算服务器           │
│   ECS 4核 8G                 │   │   ECS gn7i 8核16G + T4       │
│  ┌────────────────────────┐  │   │  ┌────────────────────────┐  │
│  │  Nginx + 主后端 + 前端 │  │   │  │  device-worker (Python)│  │
│  │  Postgres + Redis      │  │   │  │  - astropy (FITS)      │  │
│  └────────────────────────┘  │   │  │  - torch + 模型         │  │
│              │               │   │  │  - opencv (渲染)        │  │
│              │ Redis Stream  │   │  └────────────────────────┘  │
│              └───────────────┼───┼──────────────┘               │
└──────────────────────────────┘   └──────────────────────────────┘
              │                                    │
              ▼                                    ▼
    ┌──────────────────┐              ┌────────────────────┐
    │  阿里云 IoT Hub  │              │   OSS (3 buckets)  │
    │  设备认证 + 路由 │              │  原始/图片/处理结果│
    └──────────────────┘              └────────────────────┘
```

### 3.3 两机通信

- **必须同 VPC + 同可用区**，走内网 IP，延迟低且免流量费
- worker 通过内网访问 Redis Stream 和 OSS
- 不暴露任何公网端口，仅通过 SSH 跳板机管理

### 3.4 GPU Worker 容器

```dockerfile
# device-worker/Dockerfile
FROM pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

RUN apt-get update && apt-get install -y git libgl1
RUN pip install astropy opencv-python-headless Pillow redis \
                fastapi uvicorn oss2

WORKDIR /app
COPY . /app
CMD ["python", "-m", "worker.main"]
```

### 3.5 OSS 生命周期策略

设备上传文件体积大，必须配置生命周期避免成本失控：

| bucket | 策略 |
|---|---|
| device-raw（原始文件） | 30 天后转低频访问，180 天后转归档 |
| device-images（图片） | 90 天后转低频访问 |
| device-results（处理结果） | 永久保留或 1 年后归档 |

### 3.6 Phase 1 上线 Checklist

- [ ] GPU 实例已购买并安装 NVIDIA Driver + Docker GPU 支持
- [ ] 两机已加入同一 VPC，内网互通
- [ ] IoT Hub 产品已创建，设备三元组已下发到硬件
- [ ] AI 模型已训练并打包到 worker 镜像
- [ ] Redis Stream 消费组已初始化
- [ ] OSS 生命周期规则已配置
- [ ] GPU 实例闲时释放或降配（成本控制）
- [ ] Worker 健康检查 + 自动重启

---

## 4. Phase 2 部署方案（用户量增长扩容）

### 4.1 扩容触发条件

- 日活用户 > 2000
- CPU 持续 > 70% 或响应时间 > 2s
- 数据库连接数吃紧
- 单机带宽打满

### 4.2 升级路径

| 组件 | Phase 0 | Phase 2 |
|---|---|---|
| 应用服务器 | 单机 4核8G | 2-3 台 4核8G + SLB |
| 数据库 | 自建 PG | RDS PostgreSQL 高可用版 |
| Redis | 自建 | Tair 云原生版 |
| OSS | 单 bucket | 分桶 + CDN 全站加速 |
| 监控 | 无 | 云监控 + SLS 日志服务 |

### 4.3 Phase 2 架构

```
                    ┌──────────┐
                    │  阿里云   │
                    │   CDN    │
                    └────┬─────┘
                         │
                    ┌────┴─────┐
                    │   SLB    │
                    └────┬─────┘
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         ┌────────┐ ┌────────┐ ┌────────┐
         │ ECS-1  │ │ ECS-2  │ │ ECS-3  │
         │web+api │ │web+api │ │web+api │
         └────┬───┘ └────┬───┘ └────┬───┘
              └──────────┼──────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       ┌────────────┐        ┌────────────┐
       │ RDS PG HA  │        │Tair Redis  │
       │ (主备)     │        │ (云原生)   │
       └────────────┘        └────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       ┌────────────┐        ┌────────────────┐
       │  GPU Worker│        │  SLS 日志服务  │
       │  (按需扩)  │        │  + 云监控      │
       └────────────┘        └────────────────┘
```

### 4.4 Phase 2 新增服务

| 服务 | 用途 |
|---|---|
| SLB（负载均衡） | 多机流量分发 + 健康检查 |
| RDS PostgreSQL | 高可用版，自动主备切换 + 日常备份 |
| Tair（云 Redis） | 持久化 + 集群版 |
| SLS（日志服务） | 应用日志采集 + 查询 |
| 云监控 | CPU/内存/带宽告警 |
| 弹性伸缩 | 按负载自动增减 ECS |

---

## 5. 安全基线（全阶段通用）

### 5.1 网络层
- 所有数据库/Redis **仅内网访问**，安全组拒绝公网
- 管理通过 **跳板机 + SSH 密钥**，禁用密码登录
- ECS 仅开放 80/443

### 5.2 应用层
- HTTPS 强制，HSTS 开启
- 接口 WAF（阿里云 Web 应用防火墙，Phase 2 引入）
- 敏感操作二次验证
- SQL 参数化 + 输入校验（框架层保证）
- 文件上传白名单 + 大小限制 + 病毒扫描预留

### 5.3 数据层
- 密码 bcrypt 存储
- JWT Secret 强随机 + 定期轮换
- OSS Bucket 私有读 + STS 临时凭证下发
- 数据库每日备份 + 跨可用区

### 5.4 凭证管理
- AccessKey 严禁嵌入前端代码
- 推荐使用 **RAM 角色 + ECS 实例角色**，避免 AK/SK 落地

---

## 6. 域名与备案

### 6.1 域名规划
| 域名 | 用途 |
|---|---|
| `spacehunter.com`（主域） | 网页论坛 |
| `api.spacehunter.com` | 后端 API（可选，也可用主域 /api 路径） |
| `oss-img.spacehunter.com` | OSS CDN 加速域名（CNAME 到 CDN） |

### 6.2 备案流程
1. 阿里云控制台提交 ICP 备案（需服务器在阿里云且时长 ≥ 3 个月）
2. 准备：身份证、域名证书、服务器实例
3. 审核：阿里云初审 1-2 天 → 管局审核 7-20 工作日
4. 备案通过后才能正常 80/443 访问

**建议**：项目启动第一周就启动备案，与开发并行。

---

## 7. CI/CD 建议

### 7.1 推荐：阿里云容器镜像服务 + GitHub Actions

```
GitHub Push → GitHub Actions 构建 → 推送到阿里云 ACR → SSH 到 ECS docker compose pull && up -d
```

### 7.2 简化版：直接 SSH 部署

```bash
# 本地构建
docker compose build

# 推送到服务器
docker save | gzip | ssh root@server "docker load"

# 服务器重启
ssh root@server "cd /app && docker compose up -d"
```

### 7.3 环境隔离

| 环境 | 部署方式 |
|---|---|
| 本地开发 | docker-compose.dev.yml（热重载） |
| 测试 | 服务器同一台，不同端口 |
| 生产 | 独立 ECS，独立 .env |

---

## 8. 监控与运维

### 8.1 Phase 0（轻量）
- 阿里云云监控（免费）：CPU/内存/带宽告警
- Docker logs 采集到文件，定期清理
- 手动巡检

### 8.2 Phase 1+（引入 SLS）
- SLS 采集 Nginx + 应用日志
- 配置错误日志告警
- Grafana + Prometheus（可选，自建监控）

### 8.3 关键告警阈值

| 指标 | 阈值 | 动作 |
|---|---|---|
| CPU | > 80% 持续 5 分钟 | 短信告警 |
| 内存 | > 85% | 短信告警 |
| 磁盘 | > 80% | 短信 + 邮件 |
| API 5xx 率 | > 1% | 立即告警 |
| PG 连接数 | > 80 | 告警 |
| OSS 存储 | 月增长 > 50% | 告警（成本失控预警） |

---

## 9. 成本优化建议

| 项 | 建议 |
|---|---|
| ECS | 包月比按量省 30%+，长期运行建议包月 |
| GPU 实例 | 按需使用，闲时释放；或用抢占式实例（成本省 70%+，可能被回收） |
| OSS | 生命周期策略 + 合理存储类型 |
| CDN | 流量包预付费比按量便宜 |
| RDS | Phase 2 再上，Phase 0 自建即可 |
| 备份存储 | OSS 归档冷备，成本极低 |

---

## 10. 阶段演进路线图

```
Phase 0 (现在)
  单机 4核8G + OSS + CDN
  ↓
Phase 0+ (设备模块预留)
  加表 + 空接口，无新增资源
  ↓
Phase 1 (设备处理上线)
  + GPU 计算机一台
  + IoT Hub
  + 3 个 OSS bucket
  ↓
Phase 2 (用户增长)
  + SLB + 多台 ECS
  + RDS HA + Tair
  + SLS + 云监控全量
  ↓
Phase 3 (规模化)
  + 弹性伸缩
  + 多可用区容灾
  + DDoS 高防
```

---

## 11. 上线前最终确认 Checklist

### Phase 0 必做项
- [ ] ICP 备案通过
- [ ] 域名解析 + HTTPS 生效
- [ ] ECS 安全组仅 80/443
- [ ] PG 强密码 + 每日备份 cron
- [ ] OSS CORS 配置完成
- [ ] 短信模板审核通过
- [ ] 微信 OAuth 回调域名配置
- [ ] .env 全部变量已填且无泄漏
- [ ] Docker 镜像 tag 固定
- [ ] 健康检查接口可访问
- [ ] 错误日志可查看
- [ ] 首次部署演练完成

### Phase 1 追加项
- [ ] VPC 内网互通验证
- [ ] GPU 容器运行验证
- [ ] IoT Hub 设备接入联调
- [ ] OSS 生命周期生效
- [ ] Worker 自动重启验证

---

**文档状态**：定稿
**维护**：随项目阶段演进持续更新
