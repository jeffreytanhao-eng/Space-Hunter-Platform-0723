# Space Hunter 设备数据模块 Phase 0 补充规格 v1.0

**项目名称**：Space Hunter 天文社区
**文档类型**：Phase 0 补充规格（设备数据上传与处理模块）
**版本**：v1.0
**日期**：2026-07-22
**关系**：与 `Space_Hunter_天文社区_Phase0_开发规格说明书_v1.0.md` 并列，作为其扩展模块
**当前状态**：仅接口与数据模型预留，不实现处理逻辑

---

## 1. 模块概述

### 1.1 目标
为未来对接特定天文硬件（望远镜/相机等）的数据上传与处理预留完整接口与数据结构，待硬件设计完成后可直接接入处理进程，无需改动主后端契约。

### 1.2 边界
- **解耦原则**：设备上传数据**不进入论坛帖子流**，通过独立队列与独立 worker 进程处理
- **Phase 0 范围**：仅数据库表 + 接口契约 + 空壳 worker，不实现 FITS 深处理与 AI 推理
- **与主社区关系**：仅在积分系统中预留 `source = device_upload` 枚举，处理完成后回调发放积分

### 1.3 核心流程
```
硬件设备 → (HTTP POST / MQTT) → 主后端接收 → 写 device_uploads + 入队 Redis Stream
   → 独立 worker 消费 → (Phase 0 直接标记 done) → 回调主后端写结果 + 发积分
```

---

## 2. 数据模型

### 2.1 devices（设备绑定表）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint PK | 主键 |
| hardware_id | varchar(64) unique | 硬件烧录唯一标识 |
| user_id | bigint FK→users.id | 绑定用户（1:1） |
| device_token | varchar(128) | 绑定后下发的认证 token |
| name | varchar(64) | 设备名称（用户自定义） |
| status | enum | active/inactive/unbound |
| bound_at | timestamp | 绑定时间 |
| last_upload_at | timestamp | 最近上传时间 |

约束：一个 user_id 同时只能绑定一个 status=active 的设备（1:1）。

### 2.2 device_uploads（上传记录表）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint PK | 主键 |
| device_id | bigint FK→devices.id | 设备 |
| user_id | bigint FK→users.id | 绑定用户（冗余便于查询） |
| file_url | varchar(512) | OSS 文件地址 |
| file_type | enum | fits/image/raw |
| metadata | jsonb | 上传时携带的元数据（时间、坐标、曝光等） |
| status | enum | pending/processing/done/failed |
| created_at | timestamp | 上传时间 |

### 2.3 device_processing_tasks（处理任务表）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint PK | 主键 |
| upload_id | bigint FK→device_uploads.id | 关联上传记录 |
| type | enum | 见 §3 任务类型枚举 |
| status | enum | pending/processing/done/failed |
| result | jsonb | 处理结果（schema 按 type 不同） |
| error | text | 失败原因 |
| created_at | timestamp | 入队时间 |
| finished_at | timestamp | 完成时间 |

---

## 3. 任务类型枚举与结果契约

统一通过 `device_processing_tasks.type` 区分，共享一套任务队列，每个任务独立入队、独立回调。

| type 值 | 名称 | result schema |
|---|---|---|
| `ai_detect` | 目标检测 | `{ boxes: [{x, y, w, h, label, confidence}] }` |
| `ai_classify` | 天体分类 | `{ labels: [{name, confidence}] }` |
| `ai_score` | 图像评分 | `{ overall: 0-100, sub: {sharpness, noise, contrast} }` |
| `ai_enhance` | 图像增强与渲染 | `{ output_url: "oss://...", method: "..." }` |
| `fits_process` | FITS 深度处理 | `{ ... }` Phase 0 不实现 |

**Phase 0 worker 行为**：收到任意 type 任务，直接置 `status=done`、`result={}`，仅验证链路连通性。

---

## 4. 接口契约

### 4.1 设备认证流程
1. 用户通过 `/devices/bind` 提交 `hardware_id`，后端校验该 ID 未被绑定
2. 绑定成功后下发 `device_token`，设备后续上传须携带 `Authorization: Bearer <device_token>`
3. 解绑后 token 立即失效

### 4.2 HTTP 接口

| 路径 | 方法 | 认证 | 说明 |
|---|---|---|---|
| `/devices/bind` | POST | 用户 token | 绑定设备，body: `{hardware_id, name}` |
| `/devices/unbind` | POST | 用户 token | 解绑当前设备 |
| `/devices/me` | GET | 用户 token | 查询当前用户绑定的设备 |
| `/devices/upload` | POST | device_token | 设备上传入口，文件直传 OSS 后写记录入队 |
| `/devices/uploads` | GET | 用户 token | 查询本设备上传历史（分页） |
| `/devices/uploads/{id}/tasks` | GET | 用户 token | 查询某次上传的处理任务及结果 |
| `/internal/processing/callback` | POST | 内部签名 | Worker 回调入口，写 result + 触发积分 |

### 4.3 MQTT Topic 预留（阿里云 IoT Hub）

| Topic | 方向 | 说明 |
|---|---|---|
| `device/{hardware_id}/upload/meta` | 设备→云 | 上传元数据通知，含 OSS 上传凭证申请 |
| `device/{hardware_id}/upload/file` | 设备→云 | 小文件直接上行（大文件走 OSS 直传） |
| `device/{hardware_id}/command` | 云→设备 | 下行指令预留（如远程触发拍摄） |

认证：阿里云 IoT Hub 设备三元组（ProductKey + DeviceName + DeviceSecret），与 `hardware_id` 一一对应。

---

## 5. 处理进程架构

### 5.1 组件
- **主后端**：负责接收、写库、入队、回调处理、积分发放
- **Redis Stream**：任务队列，按 `type` 分 stream（`stream:device_task:ai_detect` 等）
- **Worker 进程**：独立部署，建议 Python（FastAPI + astropy + opencv 预留依赖），消费队列

### 5.2 Phase 0 空壳实现
- Worker 启动后监听所有 stream
- 收到任务 → 置 `status=processing` → 立即置 `status=done`、`result={}`
- 通过 `/internal/processing/callback` 回调主后端
- 不引入 astropy / torch 等重依赖

### 5.3 解耦收益
- 主 API 永不阻塞在计算任务上
- Phase 1 上线真实处理时，仅替换 worker 实现，主后端零改动
- worker 可水平扩展，按 type 独立扩缩容（如渲染 worker 单独上 GPU）

---

## 6. 积分预留

在主后端积分服务 `points_transactions.source` 枚举中新增：

| source 值 | 说明 |
|---|---|
| `device_upload` | 设备上传基础积分 |
| `device_ai_score_high` | AI 评分优秀奖励（Phase 1 规则待定） |
| `device_ai_detect_rare` | 稀有目标检测奖励（Phase 1 规则待定） |

Phase 0 不实际发放积分，仅在回调链路中预留触发点。

---

## 7. 部署补充

### 7.1 Phase 0（仅预留）
- 轻量 4核 8G 足够，无额外计算开销
- 阿里云 IoT Hub 按量计费，设备未接入前零成本
- OSS 新建独立 bucket 存设备上传文件，配置生命周期策略（如 90 天未访问转低频/归档）

### 7.2 Phase 1（实际处理上线）
| 组件 | 规格 | 说明 |
|---|---|---|
| 应用服务器 | ECS 4核 8G | 主后端 + 前端 + PG + Redis（沿用 Phase 0） |
| 计算服务器 | ECS 8核 16G + GPU T4 16G 起步 | 专跑 worker，渲染任务吃显存 |
| 数据库 | RDS PostgreSQL | 建议升级，省运维 |
| 对象存储 | OSS | 设备原始文件 bucket + 处理结果 bucket |
| IoT 接入 | 阿里云 IoT Hub | 设备认证与消息路由 |
| CDN | 阿里云 CDN | 处理后图片分发 |

### 7.3 成本风险
- **OSS 存储**：FITS 文件单张可达几十至上百 MB，需严控生命周期策略
- **GPU 实例**：按需使用，闲时释放，或采用抢占式实例降低成本
- **IoT Hub**：按消息条数计费，需评估设备上传频率

---

## 8. 阿里云组件清单

| 用途 | 服务 | Phase 0 是否启用 |
|---|---|---|
| 应用服务器 | ECS / 轻量应用服务器 | 是（沿用主项目） |
| 关系数据库 | RDS PostgreSQL（或自建） | 是（沿用主项目） |
| 缓存与队列 | Redis（自建或云托管） | 是（沿用主项目） |
| 对象存储 | OSS | 是，新建独立 bucket |
| IoT 接入 | 阿里云 IoT Hub | 否（设备未接入前不开通） |
| GPU 计算 | ECS GPU 实例 | 否（Phase 1） |
| CDN | 阿里云 CDN | 是（沿用主项目） |

---

## 9. 与主项目的集成点

| 集成点 | 说明 |
|---|---|
| 数据库 | 共用 PostgreSQL 实例，新增 3 张表 |
| 用户体系 | 复用 users 表，device.user_id 外键 |
| 积分系统 | `points_transactions.source` 新增枚举值 |
| 文件存储 | 复用 OSS，新增独立 bucket |
| 认证 | 复用 JWT，新增 `device_token` 类型 |
| 部署 | 主后端容器新增设备模块路由；worker 为独立容器（Phase 0 可不启动） |

---

## 10. 风险与缓解

| 风险 | 缓解措施 |
|---|---|
| 硬件协议未定 | 双协议（HTTP+MQTT）预留，覆盖 90% 主流方案 |
| AI 模型选型未定 | 任务 type 枚举先行，result schema 后续可扩展（jsonb） |
| OSS 成本失控 | 独立 bucket + 生命周期策略 + 上传频率限制 |
| Phase 1 改动扩散 | 严格解耦，Phase 1 仅替换 worker，主后端零改动 |
| 设备 token 泄露 | 支持解绑即失效 + 后续可加 IP 白名单/频率限制 |

---

**文档状态**：Phase 0 接口预留规格定稿，待主项目开发时一并落地表结构与空接口。
**下一步**：随主项目 Phase 0 开发一同实现表结构 + API 路由 + 空壳 worker，AI 与 FITS 实际处理逻辑待 Phase 1。
