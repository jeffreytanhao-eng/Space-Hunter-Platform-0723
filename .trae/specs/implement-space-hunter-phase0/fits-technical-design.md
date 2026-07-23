# FITS 专业天文图像处理技术方案

> 本文档是 spec.md "专业天文图像处理" Requirement 的技术落地规范,配合 [decisions.md ADR-002](./decisions.md#adr-002fits-专业天文图像处理采用独立-python-子服务) 阅读。
> **状态**:Accepted
> **最后更新**:2026-07-20

---

## 1. 范围与目标

### 1.1 支持格式

| 格式 | 扩展名 | 大小上限 | MIME | 处理路径 |
|---|---|---|---|---|
| FITS | `.fits` | 100 MB | `application/fits` | Python worker(必走) |
| TIFF | `.tif`/`.tiff` | 50 MB | `image/tiff` | Python worker |
| RAW Canon | `.cr2`/`.cr3` | 50 MB | `image/x-canon-cr2` | Python worker |
| RAW Nikon | `.nef` | 50 MB | `image/x-nikon-nef` | Python worker |
| RAW Sony | `.arw` | 50 MB | `image/x-sony-arw` | Python worker |
| 普通图片 | `.jpg`/`.png`/`.webp`/`.gif` | 10 MB | `image/*` | NestJS 主后端直传 COS |

### 1.2 处理目标
1. 原始文件持久化存储,可下载。
2. 生成 PNG/JPEG 预览图供网页/小程序展示(浏览器不能直接渲染 FITS)。
3. 解析 FITS header 元数据,结构化存储并在前端展示。
4. 处理失败不阻断上传,降级为"仅原始文件可下载"。

---

## 2. 架构

### 2.1 组件拓扑

```
┌─────────────┐   upload     ┌──────────────────┐
│  Client     │─────────────▶│  NestJS 主后端    │
│ (Web/MNP)   │              │  /upload         │
└─────────────┘              └────────┬─────────┘
                                      │
                       ┌──────────────┴──────────────┐
                       │                              │
                  普通图片                         FITS/TIFF/RAW
                       │                              │
                       ▼                              ▼
                 [腾讯云 COS]              [COS original/] + [Redis 队列]
                                                       │
                                                       ▼
                                            ┌──────────────────────┐
                                            │ Python fits-worker   │
                                            │ (FastAPI + RQ)       │
                                            └────────┬─────────────┘
                                                     │
                                       ┌─────────────┴─────────────┐
                                       │                           │
                                  解析元数据                   生成预览图
                                  (astropy)                   (Pillow+numpy)
                                       │                           │
                                       └───────────┬───────────────┘
                                                   ▼
                                          [COS preview/]
                                                   │
                                                   ▼
                                       [NestJS callback 回写 DB]
                                                   │
                                                   ▼
                                          [前端轮询 /fits-status]
```

### 2.2 模块划分

#### NestJS 主后端(`/server`)
- `UploadController` /upload 入口,校验大小/MIME,分流普通图 vs 专业格式。
- `FitsService` 投递任务到 Redis 队列 `queue:fits`,生成 `jobId` 返回客户端。
- `FitsCallbackController` `/internal/fits/callback` 接收 worker 回写(仅内网 + JWT 内部签名校验)。
- `FitsStatusController` `GET /posts/:id/fits-status` 给前端轮询。

#### Python 子服务(`/server-fits`)
- `api/main.py` FastAPI 健康检查 + 内部接口(可选同步处理小文件)。
- `worker/processor.py` RQ worker 主逻辑。
- `worker/fits_parser.py` astropy header 解析。
- `worker/preview_gen.py` 预览图生成。
- `worker/raw_parser.py` rawpy 包装。
- `worker/tiff_parser.py` tifffile 包装。

---

## 3. 数据模型

### 3.1 新增表 `fits_assets`

```sql
CREATE TABLE fits_assets (
  id              BIGSERIAL PRIMARY KEY,
  job_id          UUID NOT NULL UNIQUE,
  post_id         BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id         BIGINT NOT NULL REFERENCES users(id),
  format          VARCHAR(16) NOT NULL,         -- fits/tiff/cr2/nef/arw
  original_url    VARCHAR(512) NOT NULL,         -- COS original URL
  original_size   BIGINT NOT NULL,               -- bytes
  preview_url     VARCHAR(512),                  -- COS preview URL(完成后回填)
  preview_size    BIGINT,
  metadata        JSONB,                         -- FITS header 结构化数据
  status          VARCHAR(24) NOT NULL DEFAULT 'pending',
                                                 -- pending/processing/ready/failed
  error           TEXT,
  retry_count     INT NOT NULL DEFAULT 0,
  idempotency_key VARCHAR(64) UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_fits_assets_post ON fits_assets(post_id);
CREATE INDEX idx_fits_assets_status ON fits_assets(status) WHERE status IN ('pending','processing');
```

### 3.2 `posts` 表扩展

新增字段 `has_fits BOOLEAN DEFAULT false`,用于列表查询快速过滤需展示"FITS 徽标"的帖子。

---

## 4. 接口契约

### 4.1 上传(客户端 → NestJS)

```
POST /upload
Authorization: Bearer <jwt>
Content-Type: multipart/form-data
Idempotency-Key: <uuid>

file: <binary>
sourceType: post | gallery | avatar   (本需求只关注 post/gallery)
postId?: <bigint>                      (gallery 申请时已有 postId)
```

**响应(普通图片)**:
```json
{ "type": "image", "url": "https://cdn.../posts/2026/07/123/abc.jpg", "width": 1920, "height": 1080 }
```

**响应(FITS/TIFF/RAW)**:
```json
{
  "type": "fits",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "originalUrl": "https://cdn.../fits/original/...",
  "pollIntervalMs": 3000,
  "maxPollMs": 120000
}
```

### 4.2 状态轮询(客户端 → NestJS)

```
GET /posts/:postId/fits-status?jobId=...
Authorization: Bearer <jwt>
```

**响应**:
```json
{
  "jobId": "...",
  "status": "ready",          // pending/processing/ready/failed
  "previewUrl": "https://...",
  "metadata": { "OBJECT": "M31", "EXPTIME": 300, ... },
  "originalUrl": "https://...",
  "error": null
}
```

### 4.3 入队(NestJS → Redis)

队列名:`fits:process`,消息体:
```json
{
  "jobId": "550e8400-...",
  "postId": 123,
  "userId": 456,
  "format": "fits",
  "originalUrl": "https://cos.../fits/original/...",
  "originalSize": 52428800,
  "idempotencyKey": "client-uuid"
}
```

### 4.4 回写(worker → NestJS)

```
POST /internal/fits/callback
Authorization: Bearer <internal-jwt>   # 内部服务签名,HS256,scope=fits-callback
```

**成功**:
```json
{
  "jobId": "...",
  "status": "ready",
  "previewUrl": "https://cos.../fits/preview/....jpg",
  "previewSize": 234567,
  "metadata": { ... },
  "completedAt": "2026-07-20T10:00:00Z"
}
```

**失败**:
```json
{
  "jobId": "...",
  "status": "failed",
  "error": "astropy failed to parse header: truncated HDU",
  "retryable": true
}
```

### 4.5 原始文件下载

```
GET /posts/:postId/fits/original
Authorization: Bearer <jwt>
→ 302 重定向到 COS 临时签名 URL(有效期 5 分钟)
```

**鉴权**:发帖者本人直接允许;其他用户要求帖子 `status=published` 且非隐私贴。
**防滥用**:同一用户 5 分钟内下载 ≤ 10 次(Redis 计数),超出返回 429。

---

## 5. FITS Header 元数据解析

### 5.1 提取字段

astropy 解析后,提取以下标准关键字(若 header 中存在),其余原样保留在 `metadata.raw`:

| 标准 KEY | 中文展示名 | 类型 | 说明 |
|---|---|---|---|
| `OBJECT` | 观测目标 | string | 如 "M31"、"NGC 2244" |
| `TELESCOP` | 望远镜 | string | |
| `INSTRUME` | 终端仪器 | string | |
| `EXPTIME` | 曝光时间(秒) | float | |
| `FILTER` | 滤镜 | string | |
| `DATE-OBS` | 观测时间(UTC) | string | ISO 8601 |
| `RA` / `DEC` | 赤经赤纬 | string/float | 可能为 "HH:MM:SS" 或度 |
| `GAIN` | 增益 | float | |
| `CCD-TEMP` | CCD 温度 | float | |
| `XBINNING`/`YBINNING` | 像素合并 | int | |
| `NAXIS1`/`NAXIS2` | 图像尺寸 | int | |
| `BAYERPAT` | 拜耳矩阵 | string | |
| `IMAGETYP` | 图像类型 | string | LIGHT/BIAS/DARK/FLAT |
| `SITELAT`/`SITELONG` | 观测点经纬度 | float | |
| `OBSERVER` | 观测者 | string | |

### 5.2 存储结构(`fits_assets.metadata`)

```json
{
  "object": "M31",
  "telescope": "SkyWatcher 200P",
  "instrument": "ASI 294MC",
  "exposure": 300,
  "filter": "L",
  "dateObs": "2026-07-15T20:30:00Z",
  "ra": "00:42:44",
  "dec": "+41:16:09",
  "gain": 120,
  "ccdTemp": -10.0,
  "binning": "1x1",
  "dimensions": [4144, 2822],
  "imageType": "LIGHT",
  "siteLat": 39.9,
  "siteLong": 116.4,
  "observer": "user",
  "raw": { ... 原始 header 全量 }
}
```

### 5.3 解析失败处理
- header 不存在或无法解析:`metadata = null`,但 `preview_url` 仍可生成,`status=ready`。
- 文件非合法 FITS:`status=failed`,`error="invalid fits file"`,`retryable=false`。

---

## 6. 预览图生成算法

### 6.1 FITS → PNG/JPEG

```python
from astropy.io import fits
import numpy as np
from PIL import Image

def fits_to_preview(path, out_path, max_dim=1920):
    with fits.open(path) as hdul:
        data = hdul[0].data
    if data is None:
        raise ValueError("no image data in primary HDU")

    # 1. 归一化到 0-255
    arr = np.array(data, dtype=np.float32)
    arr = arr - np.percentile(arr, 1)       # 1% 拉伸
    arr = arr / (np.percentile(arr, 99) + 1e-9)
    arr = np.clip(arr * 255, 0, 255).astype(np.uint8)

    # 2. 多通道彩色(RGB CCD)处理
    if arr.ndim == 3:
        img = Image.fromarray(arr.transpose(1, 2, 0), 'RGB')
    else:
        img = Image.fromarray(arr, 'L')

    # 3. 缩放至 max_dim 内
    img.thumbnail((max_dim, max_dim), Image.LANCZOS)

    # 4. 编码(优先 JPEG 减小体积)
    img.save(out_path, 'JPEG', quality=85, optimize=True)
```

### 6.2 TIFF → JPEG
- 用 `tifffile` 读取,同上述归一化 + 缩放逻辑。

### 6.3 RAW → JPEG
- 用 `rawpy.postprocess(output_bps=8, user_flip=0)` 直接得到 RGB numpy 数组,缩放后保存。

### 6.4 输出规范
- 格式:JPEG(优先,体积小);若含 alpha 通道则 PNG。
- 最大边:1920px(列表/详情展示足够;原图仍可下载)。
- 质量:85(JPEG)。
- 命名:`fits/preview/{jobId}.jpg`。
- Content-Type:`image/jpeg`。

---

## 7. 性能与并发

### 7.1 性能验收标准(必须满足)

| 指标 | 目标值 | 测量方式 |
|---|---|---|
| 50MB FITS 预览图生成 P95 | ≤ 30s | worker 内计时 |
| 100MB FITS 预览图生成 P95 | ≤ 60s | worker 内计时 |
| TIFF 50MB P95 | ≤ 20s | |
| RAW 50MB P95 | ≤ 25s | |
| 元数据解析失败率 | ≤ 1% | 月度统计 |
| worker OOM/重启 | < 1 次/周 | Docker events |

### 7.2 并发与资源
- worker 单实例并发处理 **2** 个任务(避免 OOM)。
- worker 容器内存限制 **2GB**,超限 OOM 后 RQ 自动重试(retry_count < 3)。
- 临时文件存 `/tmp/{jobId}`,处理完立即删除。
- 单文件下载至 worker 后开始处理,处理完删除本地副本。

### 7.3 重试与死信
- 单任务最多重试 **3** 次,间隔指数退避(10s/30s/90s)。
- 3 次失败移入死信队列 `fits:dead`,触发告警(企业微信/邮件)。
- 死信任务由人工排查,可通过 Admin 后台"重新入队"。

---

## 8. 失败降级与用户体验

### 8.1 上传时降级
| 故障 | 行为 |
|---|---|
| NestJS 上传接口超时 | 客户端 5s 超时,提示"网络异常,请重试" |
| Redis 队列不可用 | `/upload` 对 FITS 返回 `503 Service Unavailable`,普通图片不受影响 |
| COS 上传失败 | 返回 `502`,提示"存储服务暂时不可用" |

### 8.2 处理中降级
| 故障 | 行为 |
|---|---|
| worker 全部宕机 | 任务停留在 `pending`,客户端轮询 2 分钟超时后展示"处理中,稍后查看" |
| 单任务失败 | `status=failed`,帖子详情仍展示原始文件下载 + "预览图生成失败"占位 |
| 元数据解析失败 | `metadata=null`,仅不渲染元数据区块,不影响预览图 |
| 预览图生成失败 | `preview_url=null`,帖子详情显示"预览图生成失败,[下载原始文件]" |

### 8.3 前端展示规则
- 列表页:若 `has_fits=true` 但 `preview_url=null`,展示带"FITS"角标的占位图。
- 详情页:展示预览图(若有)+ 元数据卡片(若有)+ 原始文件下载按钮(始终展示)。
- 轮询策略:首次 1s,退避到 3s,总时长 ≤ 120s;超时后停止轮询并显示"处理中"。
- 处理完成通过轮询拿到 `ready` 后,**不再依赖 WebSocket**,直接刷新当前帖子的 fits-status。

---

## 9. 安全

1. **上传校验**:
   - MIME + 扩展名双校验。
   - 魔数校验:FITS 文件头必须以 `SIMPLE  =` 开头;TIFF 必须为 `II*\x00` 或 `MM\x00*`;RAW 按厂商魔数。
   - 文件大小在校验后立即拒绝,不入 COS。
2. **COS 凭证**:
   - 客户端直传 COS 用 STS 临时凭证,scope 限 `posts/{userId}/*`,有效期 10 分钟。
   - worker 用永久密钥(内网),不暴露给客户端。
3. **下载鉴权**:见 4.5。
4. **worker 隔离**:Docker 网络仅允许访问 Redis + COS 内网 endpoint,不暴露公网。
5. **回调签名**:`/internal/fits/callback` 用 HS256 JWT,密钥仅 NestJS 与 worker 共享,且校验 `iss=fits-worker`。

---

## 10. 监控与告警

### 10.1 指标
- `fits_upload_total`(counter,按 format 分维度)
- `fits_process_duration`(histogram,秒)
- `fits_process_failures`(counter,按 error_type 分维度)
- `fits_queue_lag`(gauge,队列中 pending > 5 分钟的任务数)
- `fits_dead_letter`(counter)

### 10.2 告警阈值
- 队列 lag > 50 持续 5 分钟 → 告警
- 失败率 > 5%(10 分钟窗口) → 告警
- worker OOM 1 小时内 ≥ 2 次 → 告警

---

## 11. 与 spec.md / tasks.md 的映射

| spec.md Scenario | 本文档章节 |
|---|---|
| 上传 FITS 文件 | §4.1, §6 |
| 浏览器展示 FITS 内容 | §6, §8.3 |
| 下载原始 FITS 文件 | §4.5 |

| tasks.md SubTask | 本文档章节 |
|---|---|
| 1.3.3 专业格式上传 | §4.1 |
| 1.3.4 FITS 转预览图 | §6 |
| 1.3.5 解析 header 元数据 | §5 |
| 1.3.6 原始文件下载 | §4.5 |
| 1.3.7 差异化积分奖励 | 见 spec.md 积分规则(本方案不展开) |

---

## 12. 验收清单(补充到 checklist.md)

- [ ] `/server-fits` 服务可独立启动,健康检查 `/health` 返回 200
- [ ] 50MB FITS 文件上传 → 60s 内 `status=ready` 且预览图可访问
- [ ] 100MB FITS 文件上传 → 90s 内 `status=ready`
- [ ] 预览图分辨率 ≤ 1920px,JPEG quality=85,体积 < 1MB
- [ ] FITS header 元数据至少提取 OBJECT/EXPTIME/FILTER/RA/DEC/TELESCOP 6 个字段
- [ ] 非法 FITS 文件(伪造扩展名)被魔数校验拒绝
- [ ] worker 处理失败时,帖子详情仍展示原始文件下载
- [ ] 同一 jobId 重试 ≤ 3 次后进入死信队列
- [ ] `/internal/fits/callback` 拒绝无内部 JWT 的请求
- [ ] 前端轮询在 120s 内停止,超时展示"处理中"
- [ ] 性能指标暴露到 Prometheus(或云监控)
