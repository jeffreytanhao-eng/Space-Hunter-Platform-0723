# 小程序核心补全 Spec

## Why

微信小程序（Taro 4）是 Phase 0 的交付物之一，当前大部分页面已对接后端 API，但仍存在一个**阻断性缺陷**（tabBar 图标资源缺失导致无法编译运行），且缺少发帖、Follow、微信登录三项核心功能。本 Spec 补齐这些能力，使小程序达到可交付状态。

## What Changes

- 补齐 tabBar 图标资源（`src/assets/`，8 个 PNG），解决小程序无法编译的阻断问题
- 新增发帖页（文字 + 图片），同步主库帖子数据
- 新增 Follow 功能页面（关注/粉丝列表、关注/取关操作）
- 登录页接入微信快捷登录（复用已定义的 `wechatLogin` API）
- 更新 `app.config.ts` 页面注册与相关入口

## Impact

- 受影响规格：Phase 0 交付物中的「微信小程序（Taro 4，待补全）」
- 受影响代码：
  - `packages/miniapp/src/app.config.ts`（页面注册、tabBar）
  - `packages/miniapp/src/services/api.ts`（新增发帖上传、Follow 相关接口调用）
  - `packages/miniapp/src/pages/`（login、新增 post-create、follow 页面）
  - `packages/miniapp/src/assets/`（新增图标资源）
  - `packages/miniapp/src/components/`（如需新增复用组件）

## 后端依赖（已存在，仅调用）

开发以小程序后端 API 为准，不修改后端：
- 帖子：`POST /api/posts`（发帖）、列表/详情已存在
- 关注：`POST/DELETE /api/follows/:id`、`GET /api/follows/:id/status`（已定义）
- 微信登录：`POST /api/auth/wechat-login`（已定义）
- 图片上传：走主库现有上传接口

## ADDED Requirements

### Requirement: tabBar 图标资源补齐
小程序 SHALL 提供 4 个 tab 页（首页/画廊/活动/我的）各自的普通态与选中态图标，共 8 个 PNG 文件，置于 `src/assets/`，并确保 `app.config.ts` 引用的路径与实际文件一致，使 `taro build --type weapp` 可成功编译。

#### Scenario: 成功编译
- **WHEN** 运行 `npm run build:weapp`
- **THEN** 构建成功，无「图标文件缺失」类错误，4 个 tab 正常显示图标

### Requirement: 发帖功能
小程序 SHALL 提供发帖页，支持输入标题、正文、选择板块，并上传多张图片；提交后调用 `POST /api/posts` 同步主库，成功后跳转帖子详情或列表。

#### Scenario: 成功发帖
- **WHEN** 用户填写标题/正文并选择图片后点击发布
- **THEN** 帖子创建成功，返回提示，可从列表页看到新帖子

### Requirement: Follow 功能
小程序 SHALL 提供关注/粉丝页面，展示用户列表，并支持关注与取消关注操作，调用已定义的 follows API。

#### Scenario: 关注/取关
- **WHEN** 用户在关注列表点击「关注/已关注」按钮
- **THEN** 关注状态切换并持久化到主库

### Requirement: 微信登录接入
登录页 SHALL 提供微信快捷登录入口，调用 `POST /api/auth/wechat-login`，登录成功后保存 token 与用户信息，并跳转回原页面。

#### Scenario: 微信登录成功
- **WHEN** 用户点击微信登录并授权
- **THEN** 登录成功，进入首页或个人中心

## MODIFIED Requirements

### Requirement: 登录页双模式
登录页在既有手机号/验证码登录基础上，增加微信登录入口，两种方式共享同一登录态存储。

## REMOVED Requirements

（无）