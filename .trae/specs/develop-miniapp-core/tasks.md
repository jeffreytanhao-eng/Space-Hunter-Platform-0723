# Tasks

## Task 1: 补齐 tabBar 图标资源（阻断性）
- [x] 创建 `packages/miniapp/src/assets/` 目录
- [x] 生成 8 个 PNG 图标：`tab-home.png`、`tab-home-active.png`、`tab-gallery.png`、`tab-gallery-active.png`、`tab-events.png`、`tab-events-active.png`、`tab-profile.png`、`tab-profile-active.png`（81×81px，太空主题线性图标，选中态用 `#818cf8`）
- [x] 确认为图标生成提供可靠方式（脚本生成 PNG）
- [x] 验证：`app.config.ts` 引用路径与文件一致，`npm run build:weapp` 可编译

## Task 2: 开发发帖页（文字+图片）
- [x] 新增页面 `pages/post-create/index.{tsx,scss,config}`
- [x] 表单：标题、正文、板块选择、图片选择（`Taro.chooseImage` 多选）
- [x] 调用 `POST /api/posts` 同步主库
- [x] 在首页/个人中心提供发帖入口
- [x] 注册页面到 `app.config.ts`

## Task 3: 开发 Follow 功能页面
- [x] 确认后端 follows 接口的响应结构（列表/状态）
- [x] 新增关注/粉丝列表页面（复用帖子详情页的作者关注入口）
- [x] 支持关注/取关切换，调用 follows API
- [x] 注册页面到 `app.config.ts`

## Task 4: 微信登录接入登录页
- [x] 登录页 `pages/login/index` 增加微信快捷登录按钮（已存在）
- [x] 调用 `POST /api/auth/wechat-login`（`Taro.login` 获取 code）（已存在）
- [x] 登录成功后保存 token+用户信息，跳转回原页面（已存在）
- [x] 与手机号/验证码登录共享同一登录态存储（已存在）

# Task Dependencies
- Task 2、3、4 均依赖 Task 1（可编译运行环境）
- Task 2、3、4 相互独立，可并行
