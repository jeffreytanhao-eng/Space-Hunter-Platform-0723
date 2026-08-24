# Space Hunter 设备终端上传接入文档

**项目名称**：Space Hunter 天文社区
**文档类型**：设备终端（望远镜 / 相机等硬件）上传接入指南
**版本**：v1.0
**日期**：2026-08-24
**关联文档**：`Space_Hunter_设备模块_Phase0_补充规格_v1.0.md`
**对象读者**：设备端固件 / 客户端工程师，接入 Space Hunter 平台进行图片、FITS 等数据上传与处理。

---

## 1. 概述

本平台为第三方天文硬件设备提供了「绑定 → 上传 → 异步处理 → 回调」的标准 HTTP 接入通道。设备端只需持有平台下发的 **设备令牌（device_token）**，即可通过 HTTPS 上传原始数据，平台负责对象存储、任务入队，并由 Worker 消费处理后回调返回结果。

> 当前为 **Phase 0**：接口与数据链路已全部可用，Worker 为空壳实现（入队后直接标记完成，不做真实 AI/FITS 推理）。Phase 1 上线真实处理时，**设备端无需任何改动**。

### 1.1 系统边界

- 设备上传的数据**不进入**论坛帖子流，走独立队列与独立 Worker 处理。
- 设备令牌（`Bearer <device_token>`）与用户 JWT 是**两套独立鉴权**，互不通用。

---

## 2. 接入前置条件

1. 平台账号已开通，并登录取得用户 JWT（绑定设备用）。
2. 设备具备唯一的 `hardware_id`（出厂铭刻，建议长度 ≤ 64，全局唯一）。
3. 获取平台 API 域名（如生产环境 `https://spacehuntter.com`，下文以 `{BASE_URL}` 代替）。

---

## 3. 认证方式

平台使用三套凭证，按接口区分：

| 凭证 | 格式 | 用途 |
|---|---|---|
| 用户 JWT | `Authorization: Bearer <jwt>` | 用户侧：绑定 / 解绑 / 查询设备与上传记录 |
| 设备令牌 | `Authorization: Bearer <device_token>` | 设备侧：上传、查询本设备上传历史 |
| 内部令牌 | Header `x-internal-token: <value>` | Worker 处理完成回调 |

- `device_token` 在绑定成功后由 `/devices/bind` 返回，请安全持久化到设备端。
- 解绑后令牌立即失效（服务端清空）。
- 内部令牌由 `DEVICE_INTERNAL_TOKEN` 环境变量配置，仅服务端 Worker 使用，勿提供给终端设备。

---

## 4. 接口总览

| 路径 | 方法 | 认证 | 说明 |
|---|---|---|---|
| `/devices/bind` | POST | 用户 JWT | 绑定设备，下发 `device_token` |
| `/devices/unbind` | POST | 用户 JWT | 解绑当前设备 |
| `/devices/me` | GET | 用户 JWT | 查询当前绑定设备及令牌 |
| `/devices/upload` | POST | 设备令牌 | **设备上传入口**（multipart 表单） |
| `/devices/uploads` | GET | 用户 JWT | 查询本人设备上传历史（分页） |
| `/devices/uploads/{id}/tasks` | GET | 用户 JWT | 查询某次上传的处理任务及结果 |
| `/internal/processing/callback` | POST | 内部令牌 | Worker 处理完成回调（服务端） |

---

## 5. 核心流程

```
① 绑定:        用户 JWT → POST /devices/bind {hardware_id} → 返回 device_token
② 上传:        设备令牌 → POST /devices/upload (multipart: file + file_type + types?)
                → 平台存 OSS + 写 device_uploads + 入 Redis Stream
③ 异步处理:    Worker 从 Redis Stream(device:tasks) 消费任务
                （Phase 0 空壳：直接置 done；Phase 1：真实 AI/FITS 推理）
④ 回调写结果:   Worker → POST /internal/processing/callback → 更新任务与上传状态
⑤ 积分发放:    （可选）上传全流程完成后触发 device_upload 积分，由开关控制
```

---

## 6. 接口详细说明

### 6.1 绑定设备 `POST /devices/bind`

**请求头**：`Authorization: Bearer <用户JWT>`

**请求体**（JSON）：
| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `hardware_id` | string | 是 | 硬件唯一标识 |
| `name` | string | 否 | 设备名称（用户自定义） |

**应答**：
```json
{
  "deviceId": "1",
  "deviceToken": "4f8f...（32 位无横线 UUID）"
}
```

**约束**：
- 一个账号同时仅能绑定一台 `active` 设备（先解绑再绑定新设备）。
- `hardware_id` 已被其他账号激活绑定时会报错。

### 6.2 解绑设备 `POST /devices/unbind`

**请求头**：用户 JWT，无请求体。
**应答**：`{ "success": true }`
解绑后该 `device_token` 立即失效。

### 6.3 查询绑定设备 `GET /devices/me`

**请求头**：用户 JWT
**应答**：
```json
{
  "deviceId": "1",
  "hardwareId": "SN-0001",
  "name": "我的望远镜",
  "deviceToken": "4f8f...",
  "lastUploadAt": "2026-08-24T10:00:00.000Z"
}
```
未绑定设备时返回 `null`。

### 6.4 设备上传 `POST /devices/upload`

**请求头**：`Authorization: Bearer <device_token>`

**请求体**：`multipart/form-data`
| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `file` | file | 是 | 上传的文件本体（fits / 图片 / raw） |
| `file_type` | string | 是 | 取值：`fits` / `image` / `raw` |
| `types` | string | 否 | 需触发处理类型，逗号分隔（见 §7），缺省按 `file_type` 推断 |
| `metadata` | JSON 字符串 | 否 | 附加元数据（坐标、温度、曝光等，服务端存 jsonb） |

**应答**：
```json
{
  "uploadId": "1001",
  "url": "https://.../devices/.../xxxx.fits",
  "fileType": "fits",
  "status": "pending",
  "tasks": ["2001", "2002"]
}
```

说明：
- 平台自动按 `file_type` 推断处理任务：`fits→fits_process`，`image→ai_enhance`，`raw→无`；也可用 `types` 显式指定。
- 文件内容为空或不支持的类型会返回 400。

### 6.5 查询上传历史

**用户侧**：`GET /devices/uploads?page=1&pageSize=20`（用户 JWT）
**设备侧**：`GET /devices/upload` 对应设备历史的接口见 `devices/uploads`（设备令牌）。

> 说明：用户侧 `/devices/uploads` 返回本人全部设备上传；单条记录含 `processingTasks` 处理任务列表。按 `createdAt` 倒序。

### 6.6 查询某次上传的处理任务 `GET /devices/uploads/{id}/tasks`

**请求头**：用户 JWT（仅本人可查，非本人返回 403/404）
**应答**：
```json
[
  { "id": "2001", "uploadId": "1001", "type": "fits_process", "status": "done",
    "result": { "worker": "phase0-stub" }, "error": null, "finishedAt": "..." }
]
```

### 6.7 处理完成回调 `POST /internal/processing/callback`

**请求头**：`x-internal-token: <DEVICE_INTERNAL_TOKEN>`

**请求体**（JSON）：
| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `uploadId` | string | 是 | 上传记录 id |
| `type` | string | 是 | 任务类型 |
| `status` | string | 是 | `done` / `failed` |
| `result` | object | 否 | 处理结果（jsonb） |
| `error` | string | 否 | 失败原因 |

此接口**仅服务端 / 外部 Worker 使用**，设备端无需调用。接口为幂等，重复回调同任务不会重复处理。

---

## 7. 文件类型与处理任务类型

### 7.1 文件类型（`file_type`）
| 值 | 说明 | 默认处理任务 |
|---|---|---|
| `fits` | FITS 天文数据文件 | `fits_process` |
| `image` | 普通图片 | `ai_enhance` |
| `raw` | 相机 RAW | 无 |

### 7.2 处理任务类型（`types` / 任务 `type`）
| type 值 | 名称 | result schema 约定 |
|---|---|---|
| `ai_detect` | 目标检测 | `{ boxes: [{x, y, w, h, label, confidence}] }` |
| `ai_classify` | 天体分类 | `{ labels: [{name, confidence}] }` |
| `ai_score` | 图像评分 | `{ overall: 0-100, sub: {sharpness, noise, contrast} }` |
| `ai_enhance` | 图像增强与渲染 | `{ output_url: "...", method: "..." }` |
| `fits_process` | FITS 深度处理 | `{ ... }` |

> Phase 0 空壳 Worker 对所有类型任务直接置 `done`，`result` 为空壳占位。

---

## 8. 处理任务队列（供外部 Worker / 调试）

任务由主后端写入 Redis Stream，流名：**`device:tasks`**。

每条消息字段：
| 字段 | 说明 |
|---|---|
| `taskId` | 任务 id |
| `uploadId` | 上传记录 id |
| `userId` | 归属用户 id |
| `type` | 任务类型（如 `fits_process`） |
| `fileUrl` | 对象存储文件地址 |
| `fileType` | 文件类型 |

外部 Worker 可用 `XREADGROUP` + `XACK` 消费，处理完成后回调 `POST /internal/processing/callback`。主后端内置空壳 Worker 由 `DEVICE_WORKER_ENABLED=true` 控制，Phase 0 默认不启用实际处理。

---

## 9. 积分触发（可选）

当一次上传的全部处理任务完成后：
- 若全成功 → 上传状态置 `done`，触发 `device_upload` 积分（默认 0 关闭）。
- 若有失败 → 上传状态置 `failed`，不发放。

由环境变量控制：`DEVICE_POINTS_ENABLED`、`DEVICE_UPLOAD_POINTS`。

---

## 10. 状态说明

### 10.1 上传状态（`device_uploads.status`）
`pending` → `done` / `failed`

### 10.2 任务状态（`device_processing_tasks.status`）
`pending` / `processing` / `done` / `failed`

---

## 11. 示例（curl）

### 绑定设备
```bash
curl -X POST "{BASE_URL}/devices/bind" \
  -H "Authorization: Bearer <用户JWT>" \
  -H "Content-Type: application/json" \
  -d '{"hardware_id":"SN-0001","name":"我的望远镜"}'
```

### 设备上传
```bash
curl -X POST "{BASE_URL}/devices/upload" \
  -H "Authorization: Bearer <device_token>" \
  -F "file=@night.fits" \
  -F "file_type=fits" \
  -F 'metadata={"ra":"12h","dec":"-30d","temp":-10}'
```

### 处理完成回调（Worker）
```bash
curl -X POST "{BASE_URL}/internal/processing/callback" \
  -H "x-internal-token: <DEVICE_INTERNAL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"uploadId":"1001","type":"fits_process","status":"done","result":{}}'
```

---

## 12. 常见错误

| HTTP | 场景 |
|---|---|
| 401 | 缺少 / 无效的用户 JWT、设备令牌或内部令牌 |
| 400 | 缺少 `hardware_id` / 文件为空 / `file_type` 或 `types` 不合法 |
| 400 | 账号已绑定设备，或 `hardware_id` 已被他人激活 |
| 404 | 未找到绑定设备 / 上传记录不存在 |
| 403 | 访问他人上传记录 |

---

## 13. 环境变量速查（服务端）

| 变量 | 作用 |
|---|---|
| `DEVICE_WORKER_ENABLED` | 是否启用进程内空壳 Worker（`true`） |
| `DEVICE_POINTS_ENABLED` | 上传完成后是否发放积分（`true`） |
| `DEVICE_UPLOAD_POINTS` | 单次上传发放积分值 |
| `DEVICE_INTERNAL_TOKEN` | 内部回调令牌 |

---

**文档状态**：v1.0 定稿，与线上 Phase 0 实现一致。
**下一步**：Phase 1 真实处理（AI / FITS）上线后，仅替换 Worker 实现，本接入文档接口契约不变。