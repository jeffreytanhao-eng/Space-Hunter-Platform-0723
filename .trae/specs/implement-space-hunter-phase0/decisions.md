# Architecture Decision Records (ADR)

> 本文件记录 Space Hunter Phase 0 的关键技术决策。每条决策包含:背景、决策、理由、替代方案、影响、状态。
> **状态机**:Proposed → Accepted → Superseded by #N / Deprecated
> **规则**:开发前必须将所有 `Proposed` 推进到 `Accepted`;一旦 `Accepted`,实现必须遵循,偏离需新开 ADR 替换。

---

## ADR-001:后端框架选用 NestJS

- **状态**:Accepted
- **日期**:2026-07-20
- **决策者**:架构组

### 背景
开发计划书 v1.0 第 19 行写"Node.js + NestJS(推荐)或 Python FastAPI",spec.md 直接采用 NestJS 但未给出弃用 FastAPI 的理由。需要冻结决策,避免开发期反复讨论。

### 决策
后端采用 **Node.js 18 LTS + NestJS 10.x + TypeScript 5.x**,放弃 FastAPI。

### 理由
1. 与网页前端(Next.js)、小程序(Taro)同语言栈,类型定义可跨端共享(Monorepo + 共享 `types/` 包),降低维护成本。
2. NestJS 的模块化 DI 天然适配"用户/论坛/积分/画廊/活动/Admin"多领域划分,且内置 Guard/Interceptor/Pipe 满足 JWT 鉴权、参数校验、日志切面需求。
3. WebSocket 适配器(socket.io)与未来实时通知扩展点对齐。

### 替代方案
- **FastAPI**:Python 生态对 FITS(astropy)更友好,但引入第二语言后运维成本翻倍,且 FITS 处理拟独立子服务(见 ADR-002),不需要主后端用 Python。
- **Express + 自组织**:灵活但缺乏工程约束,团队规模上来后易失控。

### 影响
- FITS 处理不能在 NestJS 进程内完成,需独立子服务(ADR-002)。
- 共享类型包需在 Monorepo 根目录建 `packages/shared-types`。
- 团队需具备 NestJS 经验,否则需 1 周上手期。

---

## ADR-002:FITS 专业天文图像处理采用独立 Python 子服务

- **状态**:Accepted
- **日期**:2026-07-20

### 背景
spec.md 第 77-95 行要求支持 FITS/TIFF/RAW 上传、预览图生成、header 元数据解析、原始文件下载。Node.js 生态对 FITS 支持极弱(无成熟原生库),而 Python 有 astropy/io.fits、PIL、rawpy 等成熟方案。100MB FITS 文件若在 NestJS 主进程处理,会阻塞事件循环。

### 决策
FITS/TIFF/RAW 处理抽离为**独立 Python 3.11 微服务**(`/server-fits`),通过 HTTP 内部 API 与 NestJS 主后端通信。

### 架构
```
[Client] → [NestJS 主后端 /upload]
              │
              ├─ 普通图片 → 直接存 COS/OSS,返回 CDN URL
              │
              └─ FITS/TIFF/RAW → 写入对象存储 → 投递任务到 Redis 队列
                                                    │
                                              [Python fits-worker]
                                                    │
                                              ├─ 下载原始文件
                                              ├─ astropy 解析 header
                                              ├─ 生成 PNG/JPEG 预览图
                                              ├─ 上传预览图至 COS
                                              └─ 回写元数据 + 预览 URL 到 DB
```

### 接口契约
- **入队**:`POST /internal/fits/process` (仅内网调用,JWT 内部签名)
  - body: `{ jobId, originalUrl, format, sourcePostId }`
- **回写**:worker 完成后 `POST /internal/fits/callback`
  - body: `{ jobId, status, previewUrl, metadata, error? }`
- **查询**:NestJS 提供 `GET /posts/:id/fits-status` 给前端轮询(Phase 0 不上 WebSocket)

### 库选型
- FITS 解析:`astropy.io.fits`(业界标准)
- 预览图:`Pillow` + `numpy`(归一化 + 8bit 转换 + JPEG/PNG 编码)
- RAW 解析:`rawpy`(CR2/NEF/ARW)
- TIFF 解析:`tifffile` + `Pillow`

### 理由
1. Python 是天文学界事实标准,astropy 社区活跃,header 字段解析最完整。
2. 独立进程隔离:OOM/Crash 不影响主后端;可独立水平扩展。
3. 队列异步:100MB 文件处理可能 30s+,主后端 HTTP 请求不能阻塞这么久。
4. 未来可独立部署到 GPU 实例做更复杂处理(拉伸、叠加)。

### 替代方案
- **Node.js + 纯 wasm 方案**:无成熟 FITS wasm 库,自研成本高。
- **主后端同步处理 + 子进程**:子进程模型不便于水平扩展与监控。
- **云函数(SCF/Lambda)**:冷启动 + 100MB 内存限制 + 超时(默认 900s 但云厂商限制不一),且国内云函数对 Python astropy 镜像支持差。

### 影响
- Monorepo 新增 `/server-fits`(Python FastAPI + Celery/RQ worker)。
- 部署多一个 Docker 服务,docker-compose 增加 fits-worker + Redis 队列配置。
- 前端需要"处理中"状态 UI(骨架屏 + 轮询)。
- 验收标准补充:单文件 ≤100MB 时,预览图生成 P95 ≤ 60s;失败需有 3 次重试 + 死信队列告警。

### 降级策略
- worker 不可用时:`/upload` 接口对 FITS 返回 `202 Accepted + jobId`,前端显示"处理中";超过 10 分钟未回写则标记 `failed`,允许用户重试或仅保留原始文件下载。
- 元数据解析失败:不阻断预览图生成,metadata 字段为空对象,前端不渲染元数据区块。

---

## ADR-003:对象存储选用腾讯云 COS

- **状态**:Accepted
- **日期**:2026-07-20

### 背景
spec.md 第 12 行、计划书第 24 行均写"腾讯云 COS 或阿里云 OSS",需冻结。

### 决策
对象存储统一采用 **腾讯云 COS**,CDN 配套腾讯云 CDN。

### 理由
1. 与微信生态(同属腾讯)网络链路最优,小程序上传/下载延迟低。
2. COS 提供 `ImageMogr2` 实时图片处理(缩略图、格式转换、水印),普通图片可不在主后端生成预览,减少计算压力。
3. 腾讯云 CDN 在国内节点覆盖率与阿里云相当,但与 COS 同账号联动配置最简。

### 替代方案
- **阿里云 OSS + CDN**:功能等价,选 COS 主要因微信小程序生态协同。

### 影响
- SDK:`cos-nodejs-sdk-v5`(主后端)、`@tencent/cos-wx-sdk-v5`(小程序)。
- 凭证管理:主后端用永久密钥 + STS 给客户端临时凭证(10 分钟有效期,scope 限目录)。
- 命名规范:`space-hunter-prod`(正式)、`space-hunter-dev`(开发);目录划分:`/posts/{yyyy/mm}/{postId}/`、`/gallery/{galleryId}/`、`/avatars/{userId}/`、`/fits/original/`、`/fits/preview/`。
- 费用:存储 + 流量 + 请求,需在监控看板加入 COS 月度账单告警。

---

## ADR-004:内容审核策略采用"规则预过滤 + 人工终审"

- **状态**:Accepted
- **日期**:2026-07-20

### 背景
spec.md 多处提到"管理员审核",但未明确是纯人工还是规则辅助。纯人工在冷启动期可接受,但用户量上升后会成为瓶颈。

### 决策
采用**双层审核**:
1. **规则预过滤层**(自动化):关键词黑名单 + 腾讯云内容安全(CAP)文本/图片 API 自动打标。
2. **人工终审层**(管理员):仅处理规则层标记为 `suspect` 或高权重内容(画廊申请、活动创建)。

### 状态机
```
post.status:
  pending_auto   → 规则层待处理
  pending_manual → 规则层判 suspect,等人工
  published      → 规则层判 pass,或人工通过
  rejected       → 规则层判 block,或人工拒绝
```

### 理由
1. 普通发帖量大,纯人工审核 SLA 无法保证。
2. 画廊/活动数量小且影响大,必须人工把关。
3. 腾讯云 CAP 已与 COS 同账号,接入成本低。

### 替代方案
- **纯人工**:简单但不可扩展,管理员漏审风险高。
- **纯 AI**:Phase 0 不信任 AI 终审,出错责任不清。

### 影响
- 数据库 `posts`、`gallery_photos`、`events` 表 `status` 枚举需扩展为上述 4 值。
- Admin 后台审核列表需增加"自动通过/待人工/疑似违规"筛选。
- spec.md 第 71 行"帖子进入审核或直接发布"需明确:普通板块普通帖子若规则层 pass 则直接 `published`,不强制人工。
- 失败兜底:CAP API 超时/不可用时,降级为 `pending_manual`,不阻断上传。

---

## ADR-005:微信小程序框架选用 Taro 4.x

- **状态**:Accepted
- **日期**:2026-07-20

### 背景
计划书第 21 行写"Taro 3.x 或 uni-app 或原生",需冻结。Taro 4.x 已发布且性能优于 3.x。

### 决策
小程序采用 **Taro 4.x + React 18 + TypeScript**。

### 理由
1. 与 Next.js 同为 React 生态,组件逻辑、Hook、类型定义可部分共享(放到 `packages/shared` )。
2. Taro 4.x 编译时优化 + 长列表性能优于 3.x。
3. 未来转 H5/独立 App 时,Taro 的多端能力是预留扩展点。

### 替代方案
- **uni-app**:Vue 生态,与 Next.js(React)不同栈,共享成本高。
- **原生小程序**:性能最优但无法多端复用,与"预留独立 App"扩展点冲突。

### 影响
- 小程序依赖 React 18,与 Next.js 14 React 版本需对齐。
- Taro 4.x 对部分原生 API 有差异,需在 `packages/shared` 抽象平台层。
- 微信开发者工具 + Taro CLI 双工具链,CI 需配置预览上传脚本。

---

## ADR-006:积分变更必须走数据库事务 + 行锁

- **状态**:Accepted
- **日期**:2026-07-20

### 背景
spec.md 第 106-118 行描述积分赚取/兑换,但未说明并发一致性。积分系统是典型并发热点(用户短时间多次获赞、批量兑换),不加锁会出现负积分、超扣。

### 决策
所有积分变更操作**必须**满足以下三条:
1. 在 PostgreSQL 同一事务内完成:`SELECT ... FOR UPDATE` 锁定 `users` 行 → 修改 `points_balance` → 插入 `points_transactions` → 提交。
2. 兑换操作额外加 Redis 分布式锁(`points:lock:{userId}`,TTL 10s),防止用户多端并发兑换。
3. 所有积分变更接口幂等:基于 `points_transactions.idempotency_key` 唯一索引,重复请求返回原结果。

### 理由
1. PostgreSQL 行锁足够强,且 Phase 0 用户量级不需要更高并发方案。
2. Redis 锁防多端(JWT 多设备登录)并发兑换同一奖励。
3. 幂等键防止网络重试导致双扣/双发。

### 替代方案
- **纯 Redis 原子计数**:性能高但持久化与 DB 不一致风险大,Phase 0 不需要。
- **乐观锁(version 字段)**:并发冲突时需重试,体验差。

### 影响
- `users` 表新增 `version` 字段(乐观锁备用,Phase 0 主用行锁)。
- `points_transactions` 表新增 `idempotency_key VARCHAR(64) UNIQUE`。
- 积分相关接口请求头需带 `Idempotency-Key`(前端生成 UUID)。
- 补充 checklist 验收项:"并发 10 次同一 Idempotency-Key 兑换,仅成功 1 次"。

---

## ADR-007:Admin 后台与用户端共站但路由 + 守卫隔离

- **状态**:Accepted
- **日期**:2026-07-20

### 背景
spec.md 第 34 行说"嵌入 Next.js",但未说明权限隔离方案。Admin 与用户端共站存在 XSS 风险面扩大、Cookie 串用、CSRF 等问题。

### 决策
Admin 与用户端**同一 Next.js 应用**,但:
1. **路由隔离**:Admin 全部位于 `/admin/*` 路由组(App Router `route group`),独立 layout。
2. **中间件守卫**:`middleware.ts` 对 `/admin/*` 强制校验 `role=admin` 的 JWT,非 admin 直接 404(不暴露 Admin 路由存在)。
3. **Cookie 分离**:用户端 `token` 与 Admin `admin_token` 分开 cookie,`httpOnly + secure + sameSite=strict`。
4. **CSRF**:Admin 写操作强制 `SameSite=strict`,且校验 `Origin` 头。
5. **未来扩展**:Phase 1 可平滑迁移到独立子域名 `admin.space-hunter.com`,只需调整 Next.js `basePath` 与 Cookie domain。

### 理由
1. Phase 0 单域名部署简单,SSL 证书、CDN 配置成本最低。
2. 路由 + 中间件隔离足以抵御越权访问。
3. 子域名方案预留,迁移成本低。

### 替代方案
- **独立子域名 + 独立 Next.js 应用**:Phase 0 过度工程,运维成本翻倍。
- **独立 React SPA**:与 Next.js 重复基建。

### 影响
- `middleware.ts` 是项目核心安全文件,需有单测覆盖所有 `/admin/*` 路径。
- Admin 登录页 `/admin/login` 不应被用户端导航暴露。
- 用户端 JWT 被盗不影响 Admin(独立 token)。

---

## ADR-008:小程序发帖"实时可见"定义为"数据库提交 + 客户端刷新可见"

- **状态**:Accepted
- **日期**:2026-07-20

### 背景
spec.md 第 154 行说"写入主库即可见",但未明确客户端感知方式。Phase 0 无 WebSocket,需定义清楚避免验收歧义。

### 决策
"同步"的语义定义为:
1. **数据层**:小程序发帖请求 `POST /posts` 成功返回 `201 Created` 后,该帖在数据库 `posts` 表立即可查(`status=published` 或 `pending_auto`)。
2. **网页端感知**:用户在网页端**刷新页面或切换路由**时可见;Phase 0 不保证网页端列表实时推送。
3. **同一用户多端**:发帖用户自己在其他端的"我的发帖"列表刷新即可见。
4. **列表页缓存**:列表 API 允许最多 30 秒边缘缓存(`Cache-Control: max-age=30, s-maxage=60, stale-while-revalidate=30`),即"最坏情况下他人 60 秒后可见"。

### 理由
1. Phase 0 无实时推送基础设施,WebSocket 仅"预留"。
2. 30-60 秒最终一致性在天文社区场景可接受(非即时通讯)。
3. CDN 缓存对列表页性能至关重要,强一致会牺牲性能。

### 替代方案
- **WebSocket 实时推送**:Phase 0 不实现,Phase 1 启用。
- **禁用列表缓存强一致**:性能差,不符合 < 2s 响应要求。

### 影响
- spec.md 第 154 行需补充"可见"的精确定义(见本次 spec.md 更新)。
- checklist 验收项:"小程序发帖后,网页端刷新页面可见;60 秒内全量可见"。
- Phase 1 启用 WebSocket 时,需提供降级方案兼容旧客户端。

---

## ADR-009:Phase 0 暂不实现的功能清单(显式排除)

- **状态**:Accepted
- **日期**:2026-07-20

### 背景
spec.md 只在顶部粗略说"不包含独立 App、重度社交、支付、直播",但评论区嵌套、私信、@提及等常见社区功能未明确,开发期会反复被问。

### 决策
以下功能**明确不在 Phase 0 范围**,即使代码层预留接口也不实现业务逻辑:

| 功能 | Phase 0 | Phase 1+ |
|---|---|---|
| 评论嵌套层级 | 仅 1 层(评论直接挂在帖子下) | 多层嵌套 |
| 私信/站内信 | 不做 | Phase 1 |
| @提及 | 不做 | Phase 1 |
| 帖子编辑历史 | 仅允许编辑,不保留历史 | Phase 1 |
| 多端消息已读同步 | 不做 | Phase 1 |
| 帖子收藏 | 不做(只有点赞) | Phase 1 |
| 话题/超话 | 不做(只有板块+标签) | Phase 1 |
| 数据导出 | 不做 | Phase 1 |
| 推送通知(App/短信) | 不做 | Phase 1 |
| 付费会员 | 不做 | Phase 2+ |
| 商城实物商品 | 不做(只做虚拟徽章/头像框) | Phase 2+ |
| 直播/短视频 | 不做 | Phase 2+ |
| 独立 App | 不做(预留 API) | Phase 2+ |
| Google/Apple 登录 | 接口占位,不实现 | Phase 1 |
| 实时通知(WebSocket) | 仅预留通道,不实现业务 | Phase 1 |

### 理由
显式排除比隐性默认更利于范围控制与验收。

### 影响
- 上述功能在代码中**不留半成品**,只允许:
  - 数据库表字段预留(如 `users.push_token` 可不加)。
  - 接口路径占位返回 `501 Not Implemented`。
- checklist 不出现上述验收项。

---

## 待补充 ADR(Phase 0 开发中可能新增)

- ADR-010:PostgreSQL 主从复制策略(若 M5 性能不达标)
- ADR-011:Redis 持久化策略(AOF vs RDB)
- ADR-012:日志收集方案(ELK vs 云原生 CLS)
- ADR-013:CI/CD 流水线选型

---

## 决策变更流程

1. 任何对 `Accepted` ADR 的偏离,必须新提 ADR 并标记旧 ADR 为 `Superseded by #N`。
2. ADR 编号单调递增,不复用。
3. 新 ADR 需在 PR 描述中链接旧 ADR,并说明变更理由。
