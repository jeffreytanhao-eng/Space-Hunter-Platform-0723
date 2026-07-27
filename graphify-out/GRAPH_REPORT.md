# Graph Report - 太空猎人  (2026-07-27)

## Corpus Check
- 257 files · ~62,671 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1196 nodes · 2299 edges · 110 communities (76 shown, 34 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `48d4315`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]

## God Nodes (most connected - your core abstractions)
1. `User` - 49 edges
2. `Post` - 35 edges
3. `useTranslation()` - 25 edges
4. `RedisService` - 25 edges
5. `useAuthStore` - 25 edges
6. `compilerOptions` - 24 edges
7. `FitsAsset` - 22 edges
8. `PointsTransaction` - 21 edges
9. `Event` - 19 edges
10. `GalleryPhoto` - 18 edges

## Surprising Connections (you probably didn't know these)
- `PostDetailPage()` --calls--> `useAuthStore`  [EXTRACTED]
  packages/web/src/app/post/[id]/page.tsx → packages/web/src/stores/auth-store.ts
- `ProfileContent()` --calls--> `useAuthStore`  [EXTRACTED]
  packages/web/src/app/profile/page.tsx → packages/web/src/stores/auth-store.ts
- `EventSignup` --references--> `User`  [EXTRACTED]
  packages/server/src/database/entities/event-signup.entity.ts → packages/server/src/database/entities/user.entity.ts
- `FitsAsset` --references--> `Post`  [EXTRACTED]
  packages/server/src/database/entities/fits-asset.entity.ts → packages/server/src/database/entities/post.entity.ts
- `FitsAsset` --references--> `User`  [EXTRACTED]
  packages/server/src/database/entities/fits-asset.entity.ts → packages/server/src/database/entities/user.entity.ts

## Communities (110 total, 34 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (10): defaultModerationKeywords, MODERATION_CATEGORIES, ModerationCategory, ModerationKeywords, ModerationModule, ModerationService, ModerationDetail, ModerationOptions (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (30): STATUS_MAP, GALLERY_CATEGORIES, CATEGORIES, TABS, PostCardProps, authApi, AuthUser, CommentItem (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (11): AdminController, AdminService, AdjustPointsDto, AdminQueryDto, ApplyGalleryDto, ManageUserDto, QueryGalleryDto, ReviewGalleryDto (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (23): HomeContent(), EventsPage(), StatusBadge(), GalleryPage(), useTranslation(), Footer(), Header(), Sidebar() (+15 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (38): SectionAdmin, adjustPoints(), getPendingEvents(), getPendingGallery(), getPendingPosts(), getPendingSections(), getPointsTransactions(), getUsers() (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (9): FitsAsset, adminLogRepo, cosService, createdPhoto, dto, fitsAssetRepo, mockPhoto, CosModule (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (10): Starfield(), cn(), sendSmsCode(), AuthResponse, Button(), ButtonProps, sizes, variants (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (30): dependencies, axios, clsx, date-fns, lucide-react, next, next-themes, react (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (8): CreateEventDto, QueryEventDto, ReviewEventDto, Event, EventSignup, EventsController, EventsService, PaginatedResult

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (27): dependencies, react, react-dom, @tarojs/cli, @tarojs/components, @tarojs/plugin-framework-react, @tarojs/runtime, @tarojs/taro (+19 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (27): compilerOptions, allowJs, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules (+19 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (19): CurrentUser, CreateSectionDto, FitsCallbackDto, FitsStatusQueryDto, UpdateSectionDto, Follow, FitsController, FitsService (+11 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (6): CreatePostDto, ImageItemDto, QueryPostDto, UpdatePostDto, PostsController, PostsService

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (20): code:block1 (packages/), code:bash (# 安装所有依赖), code:bash (# 后端开发（热重载）), code:bash (# 后端单元测试), code:block5 (.), code:bash (# 开发环境), code:bash (# 交互式图谱（浏览器打开）), Docker 部署 (+12 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (11): QueryTransactionsDto, RedeemDto, PointsTransaction, PointsController, PaginatedResult, PointsService, existingTx, mockManager (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.19
Nodes (5): AuthController, LoginDto, RegisterDto, SendSmsCodeDto, WechatLoginDto

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (17): ProfileContent(), followUser(), getFollowers(), getFollowing(), getFollowStatus(), unfollowUser(), getMe(), getUser() (+9 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (9): AdminModule, ConfigModule, DatabaseModule, EventsModule, FitsModule, PostsModule, SectionsModule, AppModule (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (20): dependencies, bcrypt, class-transformer, class-validator, cos-nodejs-sdk-v5, ioredis, multer, @nestjs/common (+12 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prettier, ts-jest (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (18): compilerOptions, baseUrl, emitDecoratorMetadata, experimentalDecorators, lib, module, moduleResolution, noUnusedLocals (+10 more)

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (11): PaginatedResult, AdminLog, DeviceProcessingTask, DeviceUpload, GalleryPhoto, Post, Section, User (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (18): description, devDependencies, eslint, prettier, typescript, engines, node, name (+10 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module (+10 more)

### Community 25 - "Community 25"
Cohesion: 0.10
Nodes (20): PostDetailPage(), apiClient, token, BackendComment, BackendPaginated, createComment(), deleteComment(), getComments() (+12 more)

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (6): AppDataSource, mockComments, mockGallery, MockPost, mockPosts, mockUsers

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (15): appid, compileType, condition, description, miniprogramRoot, projectname, setting, bigPackageSizeSupport (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (5): RedisService, DEFAULT_CONFIG, RateLimitConfig, RateLimitMiddleware, ROUTE_CONFIGS

### Community 29 - "Community 29"
Cohesion: 0.23
Nodes (3): UpdatePrivacyDto, UpdateProfileDto, UsersController

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (13): extends, ignorePatterns, parser, parserOptions, project, sourceType, plugins, root (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (11): BackendEvent, BackendPaginated, cancelSignup(), createEvent(), getEvent(), getEvents(), getMyEvents(), signupEvent() (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (11): description, devDependencies, typescript, main, name, private, scripts, build (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.27
Nodes (8): getBalance(), getRewards(), getTransactions(), redeem(), Reward, TransactionQuery, Skeleton(), SkeletonProps

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (4): AppDataSource, commentTemplates, NewPost, newPosts

### Community 36 - "Community 36"
Cohesion: 0.20
Nodes (6): CommentsController, CommentsModule, CommentsService, PaginatedResult, CreateCommentDto, Comment

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (10): scripts, build, lint, start, start:debug, start:dev, start:prod, test (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.36
Nodes (3): AppController, AppService, result

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (9): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (8): applyGallery(), BackendGalleryPhoto, BackendPaginated, downloadOriginal(), getGalleryDetail(), getGalleryList(), transformGalleryPhoto(), ApplyGalleryData

### Community 41 - "Community 41"
Cohesion: 0.25
Nodes (7): IApiResponse, ImageFormat, IPaginatedResponse, IPaginationParams, IUser, ProcessingStatus, UserRole

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): NestJS Backend Server, Python FITS Worker, Taro WeChat Miniapp

### Community 43 - "Community 43"
Cohesion: 0.29
Nodes (6): moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (12): inter, metadata, LocaleInitializer(), Providers(), en, DeepValue, TranslationKey, translations (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 49 - "Community 49"
Cohesion: 0.39
Nodes (6): getToken(), isAuthenticated(), removeToken(), setToken(), AuthState, User

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (5): int, str, generate_preview(), 太空猎人 - 预览图生成器 将天文图像转换为可预览的缩略图, # TODO: 实现预览图生成逻辑

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (4): str, Processor, 太空猎人 - 图像处理 Worker 负责从队列获取任务并调度对应的解析器, # TODO: 实现任务调度逻辑

### Community 53 - "Community 53"
Cohesion: 0.40
Nodes (4): str, parse_fits(), 太空猎人 - FITS 文件解析器 解析 FITS 天文图像文件的元数据和数据, # TODO: 使用 astropy.io.fits 解析 FITS 文件

### Community 54 - "Community 54"
Cohesion: 0.40
Nodes (4): str, parse_raw(), 太空猎人 - RAW 文件解析器 解析相机 RAW 格式天文图像, # TODO: 使用 rawpy 解析 RAW 文件

### Community 55 - "Community 55"
Cohesion: 0.40
Nodes (4): str, parse_tiff(), 太空猎人 - TIFF 文件解析器 解析 TIFF 天文图像文件, # TODO: 使用 tifffile 解析 TIFF 文件

### Community 56 - "Community 56"
Cohesion: 0.27
Nodes (4): AuthModule, RedisModule, JwtStrategy, UsersModule

### Community 57 - "Community 57"
Cohesion: 0.40
Nodes (4): description, name, private, version

### Community 69 - "Community 69"
Cohesion: 0.17
Nodes (11): env, es2022, node, parserOptions, ecmaVersion, sourceType, root, rules (+3 more)

### Community 96 - "Community 96"
Cohesion: 0.20
Nodes (7): PaginatedResult, commentRepo, createdPost, dto, fitsAssetRepo, mockPost, query

### Community 108 - "Community 108"
Cohesion: 0.29
Nodes (5): mockConfigService, mockJwtService, mockRedisService, mockUser, mockUsersService

### Community 109 - "Community 109"
Cohesion: 0.33
Nodes (5): ASTRO_ALLOWED_FORMATS, ASTRO_ALLOWED_MIMES, IMAGE_ALLOWED_FORMATS, IMAGE_ALLOWED_MIMES, MAGIC_NUMBERS

## Knowledge Gaps
- **393 isolated node(s):** `code:block1 (packages/)`, `环境要求`, `code:bash (# 安装所有依赖)`, `code:bash (# 后端开发（热重载）)`, `code:bash (# 后端单元测试)` (+388 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Community 21` to `Community 96`, `Community 2`, `Community 36`, `Community 5`, `Community 8`, `Community 11`, `Community 107`, `Community 14`, `Community 56`, `Community 29`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `RedisService` connect `Community 28` to `Community 5`, `Community 108`, `Community 109`, `Community 14`, `Community 52`, `Community 21`, `Community 56`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Post` connect `Community 21` to `Community 96`, `Community 2`, `Community 36`, `Community 5`, `Community 12`, `Community 14`, `Community 17`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `code:block1 (packages/)`, `环境要求`, `code:bash (# 安装所有依赖)` to the rest of the system?**
  _404 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06972789115646258 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06284153005464481 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1349206349206349 - nodes in this community are weakly interconnected._