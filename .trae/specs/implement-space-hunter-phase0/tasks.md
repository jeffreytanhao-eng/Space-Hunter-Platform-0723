# Tasks v2.0（现状对齐版）

> Phase 0 主体已上线运行。本任务清单仅含剩余收尾工作。
> **FITS 专业图像处理链路 DEFERRED（hold），不列入当前开发任务。**
> 任务按依赖顺序排列；标注 [P] 可并行，[S] 顺序依赖。

## 设备模块接口预留补全
- [ ] Task D1：创建 devices NestJS 模块骨架 [S]
  - [ ] D1.1：建 `devices.module.ts` / `devices.controller.ts` / `devices.service.ts`
  - [ ] D1.2：确认 `devices` / `device_uploads` / `device_processing_tasks` 实体与迁移已就绪（代码已有实体）
  - [ ] D1.3：在 `points_transactions.source` 枚举预留 `device_upload` / `device_ai_score_high` / `device_ai_detect_rare`
- [ ] Task D2：实现设备认证与绑定接口 [S 依赖 D1]
  - [ ] D2.1：`POST /devices/bind`（校验 hardware_id 未绑定，下发 device_token）
  - [ ] D2.2：`POST /devices/unbind`（token 立即失效）
  - [ ] D2.3：`GET /devices/me`（查询当前用户绑定设备）
- [ ] Task D3：实现设备上传与查询接口 [S 依赖 D2]
  - [ ] D3.1：`POST /devices/upload`（device_token 鉴权，文件直传 OSS 后写 device_uploads 入队 Redis Stream）
  - [ ] D3.2：`GET /devices/uploads`（分页查询本设备上传历史）
  - [ ] D3.3：`GET /devices/uploads/{id}/tasks`（查询某次上传的处理任务及结果）
- [ ] Task D4：实现回调与积分预留 [S 依赖 D3]
  - [ ] D4.1：`POST /internal/processing/callback`（内部签名校验，写 result + 触发积分）
  - [ ] D4.2：Phase 0 worker 行为——收到任务直接置 `status=done`、`result={}`，验证链路连通（不引入重依赖）

## 小程序轻量版补全
- [ ] Task M1：浏览帖子页面对接后端 API [P]
- [ ] Task M2：发帖页（文字+图片，调用后端 API 同步主库）[P]
- [ ] Task M3：Follow 功能页面对接 [P]
- [ ] Task M4：积分 / 画廊 / 活动列表页对接 [P]

## 部署稳定化与清理
- [ ] Task P1：清理根目录 `tmp_*.sh` 调试脚本，沉淀正式部署脚本与文档 [P]
- [ ] Task P2：验证 HTTPS / Nginx / DB 部署稳定性 [P]
- [ ] Task P3：确认 server-fits DEFERRED 状态（随编排启动，仅 `/health` 可用，不处理任务）[P]

## 文档对齐
- [ ] Task T1：统一 4 份规格文档版本口径（主规格 / 计划书 / 设备补充 / 阿里云部署）[P]
- [ ] Task T2：README 与代码现状保持一致校验 [P]

## DEFERRED（hold，不列入当前开发排期）
- [ ] ~~FITS 提交任务编排（NestJS 侧 submit 逻辑）~~ — DEFERRED
- [ ] ~~FITS/TIFF/RAW 解析（Python worker）~~ — DEFERRED
- [ ] ~~预览图生成（Python worker）~~ — DEFERRED
- [ ] ~~任务调度 Processor（Python worker）~~ — DEFERRED
- [ ] ~~Worker 回调 NestJS~~ — DEFERRED

**触发条件**：硬件/数据来源明确，或运营要求支持用户上传专业天文格式时启动。

# Task Dependencies
- D1 → D2 → D3 → D4（顺序）
- M1-M4 可并行，依赖后端 posts/follows/points/gallery/events 接口（均已就绪）
- P1/P2/P3 可并行
- T1/T2 可并行
- DEFERRED 任务不参与当前排期，触发后另行拆解
