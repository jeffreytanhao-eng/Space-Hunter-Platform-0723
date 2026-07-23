# Tasks

> 对应里程碑：M0 启动 → M1 用户+论坛 → M2 积分+画廊+Follow → M3 活动+小程序 → M4 Admin+同步 → M5 测试上线 → M6 上线运营
> 任务按依赖顺序排列；标注 [P] 表示可并行，[S] 表示需顺序依赖前一项。

## Phase M0：项目启动 & 环境搭建
- [ ] Task 0.1：初始化 Monorepo 结构与基础设施
  - [ ] SubTask 0.1.1：创建 `/server`（NestJS）、`/web`（Next.js 14）、`/miniapp`（Taro 3.x）、`/docker`、`/docs` 目录与基础脚手架
  - [ ] SubTask 0.1.2：配置 ESLint/Prettier/TypeScript 共享配置与 Git 仓库
  - [ ] SubTask 0.1.3：编写 README 与本地开发环境说明（不对外发布）

## Phase M1：用户系统 + 论坛核心（Epic 1 + Epic 2 + Epic 9 基础）
- [ ] Task 1.1：数据库设计与迁移脚本（Epic 9.3）
  - [ ] SubTask 1.1.1：设计核心表（users、posts、comments、follows、sections、gallery_photos、events、event_signups、points_transactions、admin_logs）
  - [ ] SubTask 1.1.2：编写 PostgreSQL 迁移脚本 + 种子数据（5 个默认板块）
  - [ ] SubTask 1.1.3：配置 Redis 连接（会话/缓存/积分计数）
- [ ] Task 1.2：后端认证与用户系统（Epic 1）[S 依赖 1.1]
  - [ ] SubTask 1.2.1：实现手机号 + 短信验证码注册/登录接口（对接国内短信服务商）
  - [ ] SubTask 1.2.2：实现微信 OAuth 扫码登录接口（网页 + 小程序）
  - [ ] SubTask 1.2.3：实现 JWT 认证中间件 + 权限守卫
  - [ ] SubTask 1.2.4：实现用户资料管理接口（昵称、头像、简介、兴趣标签、设备）
  - [ ] SubTask 1.2.5：实现隐私设置接口
  - [ ] SubTask 1.2.6：预留第三方登录抽象层（Google/Apple 接口占位）
- [ ] Task 1.3：图片上传与存储服务（Epic 9.1）[P 与 1.2 并行]
  - [ ] SubTask 1.3.1：对接腾讯云 COS 或阿里云 OSS + CDN
  - [ ] SubTask 1.3.2：实现普通图片上传接口（格式/大小校验 ≤10MB）
  - [ ] SubTask 1.3.3：实现专业天文格式上传支持（FITS ≤100MB、TIFF/RAW ≤50MB）
  - [ ] SubTask 1.3.4：实现 FITS 后端转预览图（PNG/JPEG）用于网页/小程序展示
  - [ ] SubTask 1.3.5：解析 FITS header 元数据（观测目标/设备/曝光时间/滤镜/赤经赤纬坐标）并存储
  - [ ] SubTask 1.3.6：实现专业格式原始文件下载链接
  - [ ] SubTask 1.3.7：实现专业格式上传差异化积分奖励规则（高于普通图片）
- [ ] Task 1.4：论坛核心后端（Epic 2.1-2.4）[S 依赖 1.2]
  - [ ] SubTask 1.4.1：实现板块管理接口（默认板块 + 用户申请新板块）
  - [ ] SubTask 1.4.2：实现发帖接口（文字 + 多图，关联板块/分类/标签）
  - [ ] SubTask 1.4.3：实现回帖、评论、点赞接口
  - [ ] SubTask 1.4.4：实现帖子列表/详情/搜索/分类筛选接口（分页）
- [ ] Task 1.5：网页论坛前端基础（Epic 2 网页侧）[S 依赖 1.4]
  - [ ] SubTask 1.5.1：搭建 Next.js 14 App Router + Tailwind + shadcn/ui 框架
  - [ ] SubTask 1.5.2：实现登录/注册页（手机号 + 微信扫码）
  - [ ] SubTask 1.5.3：实现个人资料编辑页 + 隐私设置
  - [ ] SubTask 1.5.4：实现论坛首页（板块列表 + 帖子流）
  - [ ] SubTask 1.5.5：实现发帖页（含多图/专业格式上传）+ 帖子详情页（回帖/评论/点赞/FITS 元数据展示/原始文件下载）
  - [ ] SubTask 1.5.6：实现搜索与分类筛选
  - [ ] SubTask 1.5.7：建立太空科技感设计系统（深空配色 token、科技感字体、实体不透明深色卡片 + 发光边框组件库、克制微动效）
  - [ ] SubTask 1.5.8：实现响应式布局 + 移动端/微信内置浏览器适配
  - [ ] SubTask 1.5.9：实现交互便利性优化（核心入口一键可达、骨架屏加载、即时反馈、错误提示友好、键盘可访问）
  - [ ] SubTask 1.5.10：实现图片画廊式预览与荣耀画廊沉浸式大图浏览体验（突出天文美感）
  - [ ] SubTask 1.5.11：动效异步加载与首屏性能优化（首屏内容优先，避免动效拖慢渲染）
- [ ] Task 1.6：基础安全防护（Epic 9.2）[P 与 1.5 并行]
  - [ ] SubTask 1.6.1：实现输入校验、防 SQL 注入、XSS/CSRF 防护
  - [ ] SubTask 1.6.2：实现敏感操作二次确认

## Phase M2：积分 + 荣耀画廊 + Follow（Epic 4 + Epic 5 + Epic 3）
- [ ] Task 2.1：积分系统后端（Epic 4）[S 依赖 M1]
  - [ ] SubTask 2.1.1：实现积分赚取规则引擎（发帖/上传照片/获赞/精选/活动参与/画廊通过）
  - [ ] SubTask 2.1.2：实现积分余额查询 + 明细记录接口
  - [ ] SubTask 2.1.3：实现积分兑换接口（虚拟徽章/头像框/论坛特权 + 折扣卡占位）
  - [ ] SubTask 2.1.4：实现积分交易流水接口（管理员可查看/调整）
- [ ] Task 2.2：荣耀画廊后端（Epic 5）[S 依赖 2.1]
  - [ ] SubTask 2.2.1：实现画廊申请接口（从已发布照片申请）
  - [ ] SubTask 2.2.2：实现画廊审核接口（管理员通过/拒绝，通过后自动发放大量积分）
  - [ ] SubTask 2.2.3：实现画廊列表浏览接口（分类/排序/搜索）
  - [ ] SubTask 2.2.4：画廊详情展示 FITS 元数据 + 原始文件下载链接
- [ ] Task 2.3：Follow 与社交后端（Epic 3）[P 与 2.2 并行]
  - [ ] SubTask 2.3.1：实现 Follow/Unfollow 接口（双向同步关系）
  - [ ] SubTask 2.3.2：实现个人主页动态与 Follow 列表接口
  - [ ] SubTask 2.3.3：实现关注动态流（时间线）接口
- [ ] Task 2.4：网页前端积分/画廊/Follow 页面 [S 依赖 2.1-2.3]
  - [ ] SubTask 2.4.1：实现积分中心页（余额 + 赚取/消费明细 + 兑换商城）
  - [ ] SubTask 2.4.2：实现荣耀画廊页（申请入口 + 浏览/排序/搜索 + 沉浸式大图展示突出天文美感）
  - [ ] SubTask 2.4.3：实现个人主页 + Follow/动态流

## Phase M3：活动系统 + 微信小程序（Epic 6 + Epic 7）
- [ ] Task 3.1：活动系统后端（Epic 6）[S 依赖 M2]
  - [ ] SubTask 3.1.1：实现用户创建活动接口（线上/线下 + 报名上限，提交审核）
  - [ ] SubTask 3.1.2：实现管理员审核活动接口
  - [ ] SubTask 3.1.3：实现活动列表/详情/报名接口
  - [ ] SubTask 3.1.4：实现官方定期活动发布入口
  - [ ] SubTask 3.1.5：实现"我的活动"已报名列表接口
- [ ] Task 3.2：活动系统网页前端 [S 依赖 3.1]
  - [ ] SubTask 3.2.1：实现活动列表/详情/报名页
  - [ ] SubTask 3.2.2：实现创建活动页 + 我的活动页
- [ ] Task 3.3：微信小程序框架与登录（Epic 7.1）[P 与 3.1 并行]
  - [ ] SubTask 3.3.1：搭建 Taro 3.x 小程序框架
  - [ ] SubTask 3.3.2：实现小程序微信登录（对接后端 OAuth）
- [ ] Task 3.4：小程序核心功能（Epic 7.2-7.5）[S 依赖 3.3]
  - [ ] SubTask 3.4.1：实现小程序浏览帖子 + 发帖（文字+图片，调用后端 API 同步主库）
  - [ ] SubTask 3.4.2：实现小程序 Follow 功能
  - [ ] SubTask 3.4.3：实现小程序查看积分/画廊/活动列表

## Phase M4：后台管理 + 数据同步完善（Epic 8 + Epic 2.5 联动）
- [ ] Task 4.1：后台管理系统（Epic 8）[S 依赖 M1-M3]
  - [ ] SubTask 4.1.1：实现管理员登录与权限控制
  - [ ] SubTask 4.1.2：实现内容审核（帖子/画廊/活动/板块申请）
  - [ ] SubTask 4.1.3：实现用户管理（列表/封禁/积分调整/角色）
  - [ ] SubTask 4.1.4：实现积分与交易管理
  - [ ] SubTask 4.1.5：实现数据统计看板（用户/帖子/画廊/活动）
  - [ ] SubTask 4.1.6：实现论坛板块管理（启用/禁用/排序）
- [ ] Task 4.2：小程序与网页数据同步优化（Epic 2.5 联动）[S 依赖 3.4]
  - [ ] SubTask 4.2.1：验证小程序发帖 → 后端 API → 网页论坛实时可见闭环
  - [ ] SubTask 4.2.2：处理同步边界情况（图片 URL、富文本、分类一致性）
- [ ] Task 4.3：接口文档完善（Epic 9.5 交付物）[P 与 4.1 并行]
  - [ ] SubTask 4.3.1：生成 Swagger/OpenAPI 接口文档
  - [ ] SubTask 4.3.2：编写简单用户操作手册 + 管理员使用文档

## Phase M5：测试、优化、上线准备
- [ ] Task 5.1：功能测试 [S 依赖 M4]
  - [ ] SubTask 5.1.1：核心流程回归（发帖→积分→画廊→活动→兑换）
  - [ ] SubTask 5.1.2：小程序同步与多端一致性测试
- [ ] Task 5.2：性能与安全优化 [P 与 5.1 并行]
  - [ ] SubTask 5.2.1：论坛列表页响应 < 2s 验证 + CDN 图片加载优化
  - [ ] SubTask 5.2.2：安全扫描（XSS/CSRF/SQL 注入）与修复
- [ ] Task 5.3：Docker 化部署 + 云环境配置（Epic 9.4-9.5）[S 依赖 5.1]
  - [ ] SubTask 5.3.1：编写 Docker 部署脚本 + Nginx 配置
  - [ ] SubTask 5.3.2：配置国内云 ECS + SLB + CDN + HTTPS + 域名
  - [ ] SubTask 5.3.3：配置 WAF、DDoS 防护、基础监控与日志、数据库备份

## Phase M6：上线与运营准备
- [ ] Task 6.1：正式上线 + 运营后台使用培训 [S 依赖 5.3]
  - [ ] SubTask 6.1.1：生产环境部署上线
  - [ ] SubTask 6.1.2：管理员使用培训 + 冷启动内容预埋（官方高质量内容 + 线上活动引流）

# Task Dependencies
- Task 1.1 → Task 1.2 → Task 1.4 → Task 1.5（顺序）
- Task 1.3、Task 1.6 可与 Task 1.2/1.5 并行
- Task 2.1 依赖 M1 完成 → Task 2.2 依赖 2.1；Task 2.3 可与 2.2 并行
- Task 2.4 依赖 2.1/2.2/2.3
- Task 3.1 依赖 M2 → Task 3.2 依赖 3.1；Task 3.3 可与 3.1 并行 → Task 3.4 依赖 3.3
- Task 4.1 依赖 M1-M3 全部完成
- Task 4.2 依赖 3.4
- Task 4.3 可与 4.1 并行
- Task 5.1 依赖 M4 → Task 5.3 依赖 5.1；Task 5.2 可与 5.1 并行
- Task 6.1 依赖 5.3
