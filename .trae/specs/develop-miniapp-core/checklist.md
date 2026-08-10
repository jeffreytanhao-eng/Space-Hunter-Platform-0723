# Checklist

## Task 1: tabBar 图标
- [x] `packages/miniapp/src/assets/` 下存在 8 个 PNG 图标文件（home/gallery/events/profile 各普通态+选中态）
- [x] `app.config.ts` 引用的图标路径与文件实际位置一致
- [x] `npm run build:weapp` 编译成功，无图标缺失错误

## Task 2: 发帖页
- [x] 发帖页 `pages/post-create/index` 已创建并注册到 `app.config.ts`
- [x] 支持标题、正文、板块选择、多图上传
- [x] 提交调用 `POST /api/posts` 同步主库，成功后跳转
- [x] 首页或个人中心提供发帖入口

## Task 3: Follow 功能
- [x] 关注/粉丝列表页面已创建并注册到 `app.config.ts`
- [x] 展示用户列表（昵称/头像）
- [x] 支持关注/取消关注，状态持久化到主库

## Task 4: 微信登录
- [x] 登录页提供微信快捷登录入口
- [x] 调用 `POST /api/auth/wechat-login`（`Taro.login` 获取 code）
- [x] 登录成功后保存 token+用户信息，跳转回原页面
- [x] 与手机号/验证码登录共享登录态存储
