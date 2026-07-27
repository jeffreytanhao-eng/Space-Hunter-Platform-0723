# Checklist v2.0（现状对齐版）

## 现状基线（已实现，仅记录）
- [x] 后端 13 模块已实现并上线（auth/posts/comments/events/points/gallery/sections/follows/users/admin/fits/upload/redis）
- [x] 前端用户端页面 + admin 后台已实现
- [x] Docker 6 服务编排已上线（nginx→backend→web→postgres→redis→fits-worker）
- [x] 用户 / 论坛 / Follow / 积分 / 画廊 / 活动 / Admin 闭环
- [x] i18n / 腾讯云 COS / 内容审核三级 / Redis 限流
- [x] 太空科技感前端设计（Starfield 等，实体不透明深色卡片 + 发光边框）
- [x] ESA/Hubble + NOIRLab 冷启动内容填充（有意为之）
- [x] ADR 决策记录（ADR-004/006/007/008）

## 设备模块接口预留补全
- [ ] devices 模块（module/controller/service）已创建
- [ ] devices / device_uploads / device_processing_tasks 实体迁移就绪
- [ ] `POST /devices/bind`（校验未绑定，下发 device_token）
- [ ] `POST /devices/unbind`（token 立即失效）
- [ ] `GET /devices/me`
- [ ] `POST /devices/upload`（device_token 鉴权，入队 Redis Stream）
- [ ] `GET /devices/uploads`（分页）
- [ ] `GET /devices/uploads/{id}/tasks`
- [ ] `POST /internal/processing/callback`（内部签名校验 + 触发积分）
- [ ] `points_transactions.source` 预留 `device_upload` / `device_ai_score_high` / `device_ai_detect_rare`
- [ ] Phase 0 worker 收到任务标记 done、result={}（空壳，不引入重依赖）
- [ ] MQTT topic 预留（阿里云 IoT Hub，Phase 0 不开通）

## 小程序补全
- [ ] 浏览帖子页面对接后端 API
- [ ] 发帖页（文字+图片）同步主库
- [ ] Follow 功能
- [ ] 积分 / 画廊 / 活动列表页

## 部署稳定化与清理
- [ ] `tmp_*.sh` 调试脚本已清理，正式部署脚本沉淀
- [ ] HTTPS / Nginx / DB 稳定性验证通过
- [ ] server-fits DEFERRED 状态确认（仅 `/health`，不处理任务）

## 文档对齐
- [ ] 4 份规格文档版本口径统一
- [ ] README 与代码现状一致

## DEFERRED: FITS 处理链路（hold，不检查）
- [ ] ~~NestJS 提交任务编排（submit 逻辑）~~ — DEFERRED
- [ ] ~~Python worker FITS/TIFF/RAW 解析~~ — DEFERRED
- [ ] ~~预览图生成~~ — DEFERRED
- [ ] ~~任务调度 Processor~~ — DEFERRED
- [ ] ~~Worker 回调 NestJS~~ — DEFERRED

> 触发条件满足后再补检查项。当前 FITS 现状：NestJS 侧已实现状态查询/下载/回调接收，Python worker 全 TODO，发帖上传 FITS 后无处理（卡 pending）。

## 交付物（已就绪）
- [x] 完整可运行的后端 API（NestJS）
- [x] 网页论坛（Next.js 14）
- [x] 微信小程序（Taro 4，待补全）
- [x] 集成式管理后台
- [x] 数据库初始化脚本 + 种子数据
- [x] Docker 部署脚本（6 服务编排）
- [x] 接口文档（Swagger/OpenAPI）
- [x] graphify 知识图谱（post-commit 自动更新）
