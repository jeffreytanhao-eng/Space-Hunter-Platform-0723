# Space Hunter 天文社区 Phase 0 实现规格 v2.0（现状对齐版）

**版本**：v2.0（替代 v1.0）
**日期**：2026-07-27
**性质**：项目已上线运行，本版将开发文档与代码现状对齐，明确剩余收尾工作；FITS 专业图像处理链路标记为 **DEFERRED（重要但暂缓）**。

## Why
Space Hunter 天文社区 Phase 0 已上线运行（spacehuntter.com），主体功能完成。原 v1.0 规格按"全新项目"编写，与代码现实严重脱节（仍写"NestJS 或 FastAPI"、无设备模块、把已完成模块当待开发）。本版 v2.0 替代 v1.0，用于：冻结已落地的技术方案、记录已实现基线、界定剩余收尾工作，并显式将 FITS 链路标记为 DEFERRED 以避免其阻塞当前收尾。

## 技术方案（已冻结，代码层已定版）
- **后端**：NestJS 10 + TypeORM + PostgreSQL 15 + Redis 7
- **前端**：Next.js 14 App Router + React 18 + Tailwind CSS
- **小程序**：Taro 4 + React 18
- **FITS Worker**：Python FastAPI + astropy + Pillow + numpy + rawpy + tifffile（业务逻辑 DEFERRED）
- **部署**：Docker Compose 6 服务编排（nginx → backend → web → postgres → redis → fits-worker）+ Nginx 反向代理 + HTTPS
- **对象存储**：腾讯云 COS + CDN
- **认证**：JWT + Passport + 短信验证码 + 微信登录
- **内容审核**：关键词过滤 + 三级审核（pass/suspect/block）
- **国际化**：i18n（useTranslation）

## What Changes
- 将 v1.0"全新项目"假设改为"现状对齐"
- 冻结技术方案为 NestJS + Python FastAPI worker 双服务架构
- 将已完成模块从"待开发"重构为"已实现基线"（仅记录，非开发任务）
- 新增当前剩余收尾工作：设备模块接口预留补全、小程序补全、部署稳定化、文档对齐
- 将 FITS 专业图像处理链路标记为 DEFERRED（hold），不列入当前开发任务

## Impact
- 替代：`.trae/specs/implement-space-hunter-phase0/` v1.0 规格文档
- 现状基线：见下方"已实现基线"章节
- 当前剩余工作：设备模块接口预留补全、小程序轻量版补全、部署稳定化与清理、文档对齐
- Deferred：FITS 专业图像处理链路（NestJS 提交任务编排 + Python worker 解析/预览/调度）

## 已实现基线（现状记录，非本规格新增任务）
以下能力已在代码中实现并上线，仅作记录：
- **用户系统**：手机号+短信 / 微信 OAuth / JWT / 个人资料 / 隐私设置
- **论坛核心**：5 默认板块 / 发帖(文字+多图) / 回帖 / 评论 / 点赞 / 搜索 / 分类标签 / 板块申请
- **Follow**：关注/取关 / 个人主页 / 动态流
- **积分系统**：赚取规则引擎 / 余额明细 / 兑换 / 交易流水 / 并发控制(事务+行锁+Redis分布式锁+幂等键)
- **荣耀画廊**：申请 / 审核 / 列表浏览(分类/排序/搜索) / 通过后发积分
- **活动系统**：创建/审核/列表/详情/报名/官方活动/我的活动
- **后台管理**：登录权限 / 内容审核 / 用户管理 / 积分管理 / 统计看板 / 板块管理 / admin_logs
- **小程序(Taro 4)**：基础框架 + 微信登录 + 若干页面 + API 服务
- **非功能**：图片上传(COS+CDN) / 安全防护 / DB 迁移种子 / Docker 部署 / HTTPS / 监控
- **国际化**：i18n
- **太空科技感前端设计**：Starfield 组件等已落地（实体不透明深色卡片 + 发光边框，无半透明玻璃拟态）
- **内容运营**：ESA/Hubble + NOIRLab 官方天文档案图片（CC 协议）作为冷启动内容填充（有意为之，非技术债）

## ADDED Requirements（当前剩余收尾工作）

### Requirement: 设备模块接口预留补全
系统 SHALL 补全设备模块的 NestJS module/controller/service（当前仅数据库实体已建，无模块路由）。
系统 SHALL 实现设备认证与绑定接口：`/devices/bind`、`/devices/unbind`、`/devices/me`。
系统 SHALL 实现设备上传与查询接口：`/devices/upload`（device_token 鉴权，写记录入队 Redis Stream）、`/devices/uploads`（分页）、`/devices/uploads/{id}/tasks`。
系统 SHALL 实现 `/internal/processing/callback` Worker 回调入口（写 result + 触发积分）。
系统 SHALL 在 `points_transactions.source` 枚举预留 `device_upload`、`device_ai_score_high`、`device_ai_detect_rare`。
系统 SHALL Phase 0 不实现实际处理逻辑（worker 收到任务直接置 done、result={}，仅验证链路连通）。
系统 SHALL 预留 MQTT topic（阿里云 IoT Hub，Phase 0 不开通）。

#### Scenario: 设备绑定
- **WHEN** 用户提交 hardware_id 调用 `/devices/bind`
- **THEN** 系统校验该 ID 未被绑定后下发 device_token

#### Scenario: 设备上传入队
- **WHEN** 设备携带 device_token 上传文件至 `/devices/upload`
- **THEN** 系统写 device_uploads 记录并入队 Redis Stream，Phase 0 worker 标记 done 后回调发积分

### Requirement: 小程序轻量版补全
系统 SHALL 补全小程序核心功能页面与后端 API 对接：浏览帖子、发帖(文字+图片)、Follow、查看积分/画廊/活动列表。
系统 SHALL 确保小程序发帖通过后端统一 API 同步到网页论坛（写入主库即可见）。

#### Scenario: 小程序发帖同步
- **WHEN** 用户在小程序发帖并提交
- **THEN** 小程序调用后端 API 写入 posts 表，网页论坛实时可见

### Requirement: 部署稳定化与清理
系统 SHALL 清理根目录大量 `tmp_*.sh` 调试脚本，沉淀为正式部署脚本与文档。
系统 SHALL 验证 HTTPS / Nginx / DB 部署稳定性。
系统 SHALL 确认 server-fits 服务随 Docker 编排启动但业务逻辑 DEFERRED（仅 `/health` 端点可用，不处理任务）。

### Requirement: 文档对齐
系统 SHALL 统一 4 份规格文档版本口径（主规格 / 计划书 / 设备模块补充规格 / 阿里云部署方案）。
系统 SHALL 保持 README 与代码现状一致（已基本对齐，需定期校验）。

## MODIFIED Requirements
- v1.0"网页论坛前端设计规范"太空科技感设计：代码已实现（Starfield 等），从开发任务降级为现状记录
- v1.0"专业天文图像处理"需求：整体改为 DEFERRED（见下）

## DEFERRED Requirements（重要但暂缓，本阶段不实现）

### Requirement: FITS 专业图像处理链路
**状态**：DEFERRED（hold）。脚手架已搭，业务逻辑全 TODO。

**已实现部分（不列入当前开发）**：
- NestJS fits 模块：`getFitsStatus`（状态查询，前端轮询）/ `downloadOriginal`（COS 签名 URL 下载，含鉴权与频率限制 5分钟≤10次）/ `handleCallback`（接收 worker 回调，更新 FitsAsset 与 Post.hasFits）
- Controller 3 端点：`GET /posts/:postId/fits-status`、`GET /posts/:postId/fits/original`（302）、`POST /internal/fits/callback`（内部 JWT 校验）
- FitsAsset 实体 / Python worker 脚手架 / Dockerfile / 依赖清单（astropy/rawpy/tifffile/pillow/numpy/redis/cos-sdk）

**未实现部分（DEFERRED）**：
- NestJS 侧：发帖上传 FITS 后"提交处理任务给 worker"的编排逻辑（当前 fits.service 无 submit 方法）
- Python worker：FITS 解析（`parse_fits` TODO）、RAW 解析（`parse_raw` TODO）、TIFF 解析（`parse_tiff` TODO）
- Python worker：预览图生成（`generate_preview` TODO）
- Python worker：任务调度（`Processor.process` TODO）
- Python worker：回调 NestJS `/internal/fits/callback`

**触发条件**：待硬件/数据来源明确后启动，或运营要求支持用户上传专业天文格式时启动。

#### Scenario: 用户上传 FITS（当前 DEFERRED 行为）
- **WHEN** 用户上传 FITS 文件
- **THEN** 系统落库 FitsAsset 记录，但 worker 不处理（`pass`），previewUrl/metadata 保持空，状态卡在 pending；下载原始文件可用，但无预览图与元数据展示

## REMOVED Requirements
- v1.0"全新项目"假设：已移除，改为现状对齐
- v1.0 中将已完成模块列为待开发任务：已移除，迁入"已实现基线"
