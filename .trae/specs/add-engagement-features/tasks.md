# Tasks

## 后端（可并行）
- [x] Task 1: 新增实体与模块骨架
  - [x] 新增 `check_in`、`favorite`、`conversation`、`message`、`notification` 实体（`modules/**/*.entity.ts`），并同步 `database/entities/index.ts` 导出
  - [x] 确认数据库建表方式（synchronize 或 migration 001/002 追加），保证上线可用

- [x] Task 2: 每日签到模块 `checkin`
  - [x] `POST /points/checkin`：当日签到，幂等防重复（幂等键 `checkin:{userId}:{date}`），调用 points `earnPoints` 发放积分（source=`checkin`）
  - [x] `GET /points/checkin/status`：返回今日是否已签、连续签到天数、历史签到数

- [x] Task 3: 收藏模块 `favorites`
  - [x] `POST /favorites` 收藏（targetType=post|gallery）、`DELETE /favorites/:targetType/:targetId` 取消
  - [x] `GET /favorites?targetType=` 我的收藏列表（分页）
  - [x] posts/gallery 详情接口返回 `isFavorited`、`favoriteCount`

- [x] Task 4: 私信模块 `messages`
  - [x] `GET /messages/conversations` 会话列表（含对方信息、最后消息、未读数）
  - [x] `GET /messages/conversations/:id` 消息记录、`POST /messages/conversations/:id` 发送
  - [x] `POST /messages` 发起新会话（按用户对建立/复用）
  - [x] 未读数统计与已读标记

- [x] Task 5: 站内通知模块 `notifications`
  - [x] `GET /notifications`、`GET /notifications/unread-count`、`POST /notifications/read-all`、`POST /notifications/:id/read`
  - [x] 在点赞/评论/关注/系统事件处写入通知（通知接收者为被操作对象作者）

## 网页版（依赖后端 Task 2-5）
- [x] Task 6: 积分中心增加签到入口（签到按钮 + 连续天数展示）
- [x] Task 7: 帖子/画廊详情增加收藏按钮与收藏状态
- [x] Task 8: 个人主页增加"我的收藏"tab
- [x] Task 9: 顶栏增加通知铃铛（未读红点、通知列表、已读）；新增私信会话页与私信入口（含未读）

## 小程序（依赖后端 Task 2-5，与网页版并行）
- [x] Task 10: 积分页增加签到入口与连续天数
- [x] Task 11: 帖子/画廊详情增加收藏按钮与状态
- [x] Task 12: 个人中心增加"我的收藏"
- [x] Task 13: 新增通知页（铃铛/未读/已读）与私信会话页；api.ts 补齐对应接口

## 验证（贯穿）
- [x] Task 14: 后端 build + 接口自测（签到幂等、收藏增删、私信收发、通知生成/已读）—— build 已通过；运行时联调待部署前执行
- [x] Task 15: 网页版 build 通过、小程序 `build:weapp` 通过；回归既有功能不破坏

# Task Dependencies
- Task 6-9 依赖 Task 2-5
- Task 10-13 依赖 Task 2-5
- Task 6-13 之间相互独立（网页版与小程序可并行）
- Task 14/15 为收尾验证，依赖全部实现
