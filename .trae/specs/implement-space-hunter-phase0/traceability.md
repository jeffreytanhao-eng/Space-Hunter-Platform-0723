# 需求-任务-验收 三向追溯矩阵

> 本文档建立 `spec.md`(Requirement/Scenario) ↔ `tasks.md`(SubTask) ↔ `checklist.md`(验收项) 的映射,作为单一事实来源。
> **使用方式**:
> - 实现某 SubTask 前,先查表确认对应 Requirement 与验收项。
> - PR 描述必须链接本表对应行号。
> - 新增需求时,三份文档与本表同步更新,不允许只改其中一份。
> **图例**:`✅` 已覆盖 / `⚠️` 部分覆盖 / `❌` 未覆盖(必须补)

---

## 1. 用户系统与认证

| spec.md Requirement | Scenario | tasks.md SubTask | checklist.md 验收项 | 覆盖 |
|---|---|---|---|---|
| 用户系统与认证 (L41-47) | 手机号注册登录 (L49-51) | 1.2.1 | L4 | ✅ |
| | 微信扫码登录 (L53-55) | 1.2.2 | L5 | ✅ |
| | 完善个人资料 (L57-59) | 1.2.4 | L6 | ✅ |
| | 隐私设置 | 1.2.5 | L7 | ✅ |
| | 第三方登录抽象层 | 1.2.6 | L8 | ✅ |
| | JWT 鉴权(规格 SHALL) | 1.2.3 | L9 | ✅ |

**注**:spec.md L41-47 与 checklist L4-9、tasks 1.2.1-1.2.6 完全对齐,无遗漏。

---

## 2. 论坛核心

| spec.md Requirement | Scenario | tasks.md SubTask | checklist.md 验收项 | 覆盖 |
|---|---|---|---|---|
| 论坛核心 (L61-67) | 用户发帖 (L69-71) | 1.4.2 | L12, L13 | ✅ |
| | 帖子搜索筛选 (L73-75) | 1.4.4 | L15 | ✅ |
| | SHALL 5 个默认板块 | 1.1.2(种子) + 1.4.1(接口) | L12 | ✅ |
| | SHALL 回帖/评论/点赞 | 1.4.3 | L14 | ✅ |
| | SHALL 分类/标签/搜索 | 1.4.4 | L15 | ✅ |
| | SHALL 申请新板块 | 1.4.1 | L16 | ✅ |
| | SHALL 发帖后发积分 | 2.1.1(规则引擎) | L17 | ✅ |
| | SHALL 普通图 ≤10MB | 1.3.2 | L13 | ✅ |
| | SHALL 专业格式见图像处理 | 1.3.3-1.3.7 | L19-28 | ✅ |

**注**:论坛核心对齐良好。**但 spec.md 第 71 行"进入审核或直接发布"语义模糊**,由 [ADR-004](./decisions.md#adr-004内容审核策略采用规则预过滤--人工终审)明确为"规则层 pass 直接 published,suspect 进人工"。

---

## 3. 专业天文图像处理

| spec.md Requirement | Scenario | tasks.md SubTask | checklist.md 验收项 | 覆盖 |
|---|---|---|---|---|
| 专业天文图像处理 (L77-83) | 上传 FITS 文件 (L85-87) | 1.3.3 | L20, L21 | ✅ |
| | 浏览器展示 FITS (L89-91) | 1.3.4 | L22, L23 | ✅ |
| | 下载原始 FITS (L93-95) | 1.3.6 | L27 | ✅ |
| | SHALL FITS ≤100MB | 1.3.3 | L21 | ✅ |
| | SHALL 生成预览图 | 1.3.4 | L22 | ✅ |
| | SHALL 解析 header 元数据 | 1.3.5 | L24, L25, L26 | ✅ |
| | SHALL 差异化积分奖励 | 1.3.7 | L28 | ✅ |
| | SHALL 原始文件下载 | 1.3.6 | L27 | ✅ |

**注**:此 Requirement 的**技术落地细节**由 [fits-technical-design.md](./fits-technical-design.md) 承载,本矩阵仅做映射。**性能验收标准**(P95 ≤ 60s 等)尚未进入 checklist.md,需补充。

---

## 4. Follow 与社交基础

| spec.md Requirement | Scenario | tasks.md SubTask | checklist.md 验收项 | 覆盖 |
|---|---|---|---|---|
| Follow 与社交 (L97-100) | 关注用户 (L102-104) | 2.3.1 | L31 | ✅ |
| | SHALL Follow 列表与动态 | 2.3.2 | L32 | ✅ |
| | SHALL 关注动态流时间线 | 2.3.3 | L33 | ✅ |

**注**:无遗漏。

---

## 5. 积分系统

| spec.md Requirement | Scenario | tasks.md SubTask | checklist.md 验收项 | 覆盖 |
|---|---|---|---|---|
| 积分系统 (L106-110) | 积分赚取 (L112-114) | 2.1.1 | L36 | ✅ |
| | 积分兑换 (L116-118) | 2.1.3 | L38, L39 | ✅ |
| | SHALL 余额查询+明细 | 2.1.2 | L37 | ✅ |
| | SHALL 兑换(虚拟徽章等) | 2.1.3 | L38 | ✅ |
| | SHALL 交易流水(管理员) | 2.1.4 | L40 | ✅ |

**注**:功能覆盖完整,但**并发一致性**(事务、行锁、幂等)由 [ADR-006](./decisions.md#adr-006积分变更必须走数据库事务--行锁)补充,验收项需在 checklist 增"并发 10 次同 Idempotency-Key 仅成功 1 次"。

---

## 6. 荣耀画廊

| spec.md Requirement | Scenario | tasks.md SubTask | checklist.md 验收项 | 覆盖 |
|---|---|---|---|---|
| 荣耀画廊 (L120-124) | 申请画廊 (L126-128) | 2.2.1 | L43 | ✅ |
| | 画廊审核通过 (L130-132) | 2.2.2 | L44, L45, L46 | ✅ |
| | SHALL 列表浏览/排序/搜索 | 2.2.3 | L47 | ✅ |
| | SHALL 详情展示 FITS 元数据+下载 | 2.2.4 | L48 | ✅ |

**注**:无遗漏。

---

## 7. 活动系统

| spec.md Requirement | Scenario | tasks.md SubTask | checklist.md 验收项 | 覆盖 |
|---|---|---|---|---|
| 活动系统 (L134-139) | 用户创建活动 (L141-143) | 3.1.1 | L51 | ✅ |
| | 用户报名活动 (L145-147) | 3.1.3 | L53 | ✅ |
| | SHALL 管理员审核活动 | 3.1.2 | L52 | ✅ |
| | SHALL 官方定期活动 | 3.1.4 | L54 | ✅ |
| | SHALL 我的活动 | 3.1.5 | L55 | ✅ |

**注**:活动系统在计划书标记 P1,但 tasks.md 仍进入 M3 主路径。**参见本目录 spec.md 顶部 P0/P1 分级表**。

---

## 8. 微信小程序

| spec.md Requirement | Scenario | tasks.md SubTask | checklist.md 验收项 | 覆盖 |
|---|---|---|---|---|
| 微信小程序 (L149-154) | 小程序发帖同步 (L156-158) | 3.4.1 | L62 | ✅ |
| | SHALL 框架+微信登录 | 3.3.1, 3.3.2 | L58 | ✅ |
| | SHALL 浏览/发帖 | 3.4.1 | L59 | ✅ |
| | SHALL Follow | 3.4.2 | L60 | ✅ |
| | SHALL 查看积分/画廊/活动 | 3.4.3 | L61 | ✅ |
| | SHALL 通过后端 API 同步 | 3.4.1 + 4.2.1 | L62 | ✅ |

**注**:"实时可见"定义由 [ADR-008](./decisions.md#adr-008小程序发帖实时可见定义为数据库提交--客户端刷新可见)补充。

---

## 9. 后台管理系统

| spec.md Requirement | Scenario | tasks.md SubTask | checklist.md 验收项 | 覆盖 |
|---|---|---|---|---|
| 后台管理系统 (L160-166) | 管理员审核内容 (L168-170) | 4.1.2 | L66, L71 | ✅ |
| | SHALL 管理员登录+权限 | 4.1.1 | L65 | ✅ |
| | SHALL 用户管理 | 4.1.3 | L67 | ✅ |
| | SHALL 积分与交易管理 | 4.1.4 | L68 | ✅ |
| | SHALL 数据统计看板 | 4.1.5 | L69 | ✅ |
| | SHALL 板块管理 | 4.1.6 | L70 | ✅ |

**注**:Admin 路由隔离由 [ADR-007](./decisions.md#adr-007admin-后台与用户端共站但路由--守卫隔离)补充,checklist 需增"`/admin/*` 路由非 admin 返回 404"。

---

## 10. 网页论坛前端设计规范

| spec.md Requirement | Scenario | tasks.md SubTask | checklist.md 验收项 | 覆盖 |
|---|---|---|---|---|
| 前端设计规范 (L172-182) | 用户首次访问 (L184-186) | 1.5.4, 1.5.7 | L74, L75 | ✅ |
| | 移动端浏览 (L188-190) | 1.5.8 | L78 | ✅ |
| | 浏览荣耀画廊 (L192-194) | 1.5.10, 2.4.2 | L82 | ✅ |
| | 加载与等待 (L196-198) | 1.5.9 | L80 | ✅ |
| | SHALL 实体不透明深色卡片 | 1.5.7 | L75 | ✅ |
| | SHALL 科技感字体 | 1.5.7 | L76 | ✅ |
| | SHALL 克制微动效 | 1.5.7 | L77 | ✅ |
| | SHALL 响应式 | 1.5.8 | L78 | ✅ |
| | SHALL 核心入口一键可达 | 1.5.9 | L79 | ✅ |
| | SHALL 骨架屏+即时反馈 | 1.5.9 | L80 | ✅ |
| | SHALL 图片画廊式预览 | 1.5.10 | L81 | ✅ |
| | SHALL 暗色主题 | 1.5.7 | L82 | ✅ |
| | SHALL 视觉层次+键盘可访问 | 1.5.9 | L83 | ✅ |
| | SHALL 动效异步加载 | 1.5.11 | L84 | ✅ |

**注**:对齐良好。**用户偏好补充**(memory_user_profile):"用户偏好不透明背景,不使用玻璃拟态"已由 spec.md L174 显式约束。

---

## 11. 非功能与部署

| spec.md Requirement | Scenario | tasks.md SubTask | checklist.md 验收项 | 覆盖 |
|---|---|---|---|---|
| 非功能与部署 (L200-208) | 图片上传 (L210-212) | 1.3.1, 1.3.2 | L87 | ✅ |
| | SHALL 防 XSS/CSRF/SQL 注入 | 1.6.1 | L88 | ✅ |
| | SHALL 敏感操作二次确认 | 1.6.2 | L88 | ✅ |
| | SHALL 数据库迁移+种子 | 1.1.2 | L89 | ✅ |
| | SHALL Docker + 国内云 | 5.3.1, 5.3.2 | L90, L91 | ✅ |
| | SHALL WAF/DDoS/监控/备份 | 5.3.3 | L92 | ✅ |
| | SHALL 列表页 < 2s | 5.2.1 | L93 | ✅ |
| | SHALL 兼容主流浏览器 | 1.5.8 | L94 | ✅ |
| | SHALL 数据库备份 | 5.3.3 | L92 | ✅ |

**注**:Swagger/OpenAPI 文档由 4.3.1 承担(checklist L95),用户/管理员手册由 4.3.2 承担(checklist L96)。

---

## 12. 缺口汇总(本次新增文档补充的覆盖)

以下为原 spec/tasks/checklist 三件套**未覆盖、由本次新增文档补足**的内容:

| 缺口 | 补充文档 | 章节链接 |
|---|---|---|
| 后端框架未冻结 | decisions.md ADR-001 | [链接](./decisions.md#adr-001后端框架选用-nestjs) |
| FITS 处理链路未定 | decisions.md ADR-002 + fits-technical-design.md | [链接](./decisions.md#adr-002) |
| 对象存储未选型 | decisions.md ADR-003 | [链接](./decisions.md#adr-003对象存储选用腾讯云-cos) |
| 审核策略未定 | decisions.md ADR-004 | [链接](./decisions.md#adr-004) |
| 小程序框架未冻结 | decisions.md ADR-005 | [链接](./decisions.md#adr-005微信小程序框架选用-taro-4x) |
| 积分并发一致性未定 | decisions.md ADR-006 | [链接](./decisions.md#adr-006) |
| Admin 路由隔离未定 | decisions.md ADR-007 | [链接](./decisions.md#adr-007) |
| "实时可见"语义模糊 | decisions.md ADR-008 | [链接](./decisions.md#adr-008) |
| 不做功能清单未显式 | decisions.md ADR-009 | [链接](./decisions.md#adr-009phase-0-暂不实现的功能清单显式排除) |
| FITS 性能验收标准缺失 | fits-technical-design.md §7.1, §12 | [链接](./fits-technical-design.md) |
| P0/P1 分级未在 spec 顶部 | spec.md(本次更新) | 见下文 |

---

## 13. 待补 checklist 验收项(本次新增)

以下验收项需补充到 checklist.md,确保 ADR 决策可被验收:

### 专业天文图像处理
- [ ] 50MB FITS 上传 P95 ≤ 30s 生成预览图
- [ ] 100MB FITS 上传 P95 ≤ 60s 生成预览图
- [ ] 非法 FITS(伪造扩展名)被魔数校验拒绝
- [ ] worker 失败重试 ≤ 3 次后进入死信队列
- [ ] `/internal/fits/callback` 拒绝无内部 JWT 请求
- [ ] 前端轮询 120s 超时后停止并展示"处理中"

### 积分系统
- [ ] 并发 10 次同 Idempotency-Key 兑换仅成功 1 次
- [ ] 积分变更走数据库事务(行锁验证:并发兑换不出现负积分)

### 后台管理系统
- [ ] `/admin/*` 路由对非 admin 用户返回 404
- [ ] Admin token 与用户 token 独立 cookie
- [ ] Admin 写操作校验 Origin 头

### 小程序同步
- [ ] 小程序发帖后,网页端刷新页面可见
- [ ] 小程序发帖 60 秒内全量可见(列表缓存过期)

---

## 14. 维护规则

1. 任何对 spec.md 的 Requirement 新增/修改,必须同步:
   - tasks.md 新增 SubTask 或修改对应项
   - checklist.md 新增/修改验收项
   - 本矩阵同步更新对应行
2. 任何对 tasks.md SubTask 的拆分/合并,必须更新本矩阵。
3. 本矩阵的 `覆盖` 列不允许出现 `❌` 进入 M5 阶段;M5 前必须全部 `✅` 或明确降级 P1。
4. PR 审查清单包含:"是否更新了 traceability.md?"。
