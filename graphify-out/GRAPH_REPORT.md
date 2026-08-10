# Graph Report - d:\项目\太空猎人  (2026-08-10)

## Corpus Check
- 272 files · ~92,611 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1417 nodes · 2742 edges · 112 communities (82 shown, 30 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin Management & Types|Admin Management & Types]]
- [[_COMMUNITY_FITS Astrometry Processing|FITS Astrometry Processing]]
- [[_COMMUNITY_Project Architecture & Documentation|Project Architecture & Documentation]]
- [[_COMMUNITY_Admin Backend (NestJS)|Admin Backend (NestJS)]]
- [[_COMMUNITY_Taro Miniapp (WeChat)|Taro Miniapp (WeChat)]]
- [[_COMMUNITY_Web Frontend Pages|Web Frontend Pages]]
- [[_COMMUNITY_Ads & Map Integration|Ads & Map Integration]]
- [[_COMMUNITY_Web Dependencies|Web Dependencies]]
- [[_COMMUNITY_Auth Module|Auth Module]]
- [[_COMMUNITY_Posts & Comments Module|Posts & Comments Module]]
- [[_COMMUNITY_Points System|Points System]]
- [[_COMMUNITY_Gallery Module|Gallery Module]]
- [[_COMMUNITY_Events Module|Events Module]]
- [[_COMMUNITY_Follows Module|Follows Module]]
- [[_COMMUNITY_Upload Module|Upload Module]]
- [[_COMMUNITY_FITS Worker Processing|FITS Worker Processing]]
- [[_COMMUNITY_Users Module|Users Module]]
- [[_COMMUNITY_Volc Engine Integration|Volc Engine Integration]]
- [[_COMMUNITY_Common Utilities & Security|Common Utilities & Security]]
- [[_COMMUNITY_Database Entities|Database Entities]]
- [[_COMMUNITY_Server Config & Module|Server Config & Module]]
- [[_COMMUNITY_FITS Worker Docker|FITS Worker Docker]]
- [[_COMMUNITY_Server Package Config|Server Package Config]]
- [[_COMMUNITY_Server Test|Server Test]]
- [[_COMMUNITY_FITS Worker Dependencies|FITS Worker Dependencies]]
- [[_COMMUNITY_Docker Compose|Docker Compose]]
- [[_COMMUNITY_Miniapp Config|Miniapp Config]]
- [[_COMMUNITY_Shared Types|Shared Types]]
- [[_COMMUNITY_Web Config|Web Config]]
- [[_COMMUNITY_Web i18n|Web i18n]]
- [[_COMMUNITY_Web Store|Web Store]]
- [[_COMMUNITY_UI Components|UI Components]]
- [[_COMMUNITY_Web Auth Service|Web Auth Service]]
- [[_COMMUNITY_Fits Asset Entity|Fits Asset Entity]]
- [[_COMMUNITY_Device Module Entities|Device Module Entities]]
- [[_COMMUNITY_Server-fits Worker|Server-fits Worker]]
- [[_COMMUNITY_Server-fits Preview|Server-fits Preview]]
- [[_COMMUNITY_Sections Module|Sections Module]]
- [[_COMMUNITY_Redis Module|Redis Module]]
- [[_COMMUNITY_Seed Data|Seed Data]]
- [[_COMMUNITY_Migrations|Migrations]]
- [[_COMMUNITY_Web ESLint|Web ESLint]]
- [[_COMMUNITY_Server ESLint|Server ESLint]]
- [[_COMMUNITY_Root ESLint|Root ESLint]]
- [[_COMMUNITY_Root Package|Root Package]]
- [[_COMMUNITY_Nginx Config|Nginx Config]]
- [[_COMMUNITY_Dockerfile Config|Dockerfile Config]]
- [[_COMMUNITY_Root Config|Root Config]]
- [[_COMMUNITY_Miniapp Post-card|Miniapp Post-card]]
- [[_COMMUNITY_Miniapp Gallery|Miniapp Gallery]]
- [[_COMMUNITY_Miniapp Points|Miniapp Points]]
- [[_COMMUNITY_Miniapp Events|Miniapp Events]]
- [[_COMMUNITY_Miniapp Index|Miniapp Index]]
- [[_COMMUNITY_Miniapp Login|Miniapp Login]]
- [[_COMMUNITY_Miniapp Post-detail|Miniapp Post-detail]]
- [[_COMMUNITY_Miniapp Profile|Miniapp Profile]]
- [[_COMMUNITY_Miniapp Config Files|Miniapp Config Files]]
- [[_COMMUNITY_Miniapp Services|Miniapp Services]]
- [[_COMMUNITY_Miniapp Auth Store|Miniapp Auth Store]]
- [[_COMMUNITY_Miniapp Request Utils|Miniapp Request Utils]]
- [[_COMMUNITY_Miniapp App Config|Miniapp App Config]]
- [[_COMMUNITY_SMS Verification API|SMS Verification API]]
- [[_COMMUNITY_FITS Technical Design|FITS Technical Design]]
- [[_COMMUNITY_Deployment Plan|Deployment Plan]]
- [[_COMMUNITY_Devices Spec|Devices Spec]]
- [[_COMMUNITY_Implement Spec v2|Implement Spec v2]]
- [[_COMMUNITY_Web Volc Test|Web Volc Test]]
- [[_COMMUNITY_Fits Compare Viewer|Fits Compare Viewer]]
- [[_COMMUNITY_Starfield Effect|Starfield Effect]]
- [[_COMMUNITY_Language Switcher|Language Switcher]]
- [[_COMMUNITY_Locale Initializer|Locale Initializer]]
- [[_COMMUNITY_Admin Login Page|Admin Login Page]]
- [[_COMMUNITY_Gallery Page|Gallery Page]]
- [[_COMMUNITY_Events Page|Events Page]]
- [[_COMMUNITY_Points Page|Points Page]]
- [[_COMMUNITY_Post Detail Page|Post Detail Page]]
- [[_COMMUNITY_Profile Page|Profile Page]]
- [[_COMMUNITY_Follow Feed|Follow Feed]]
- [[_COMMUNITY_Web Services|Web Services]]
- [[_COMMUNITY_Web Lib Utils|Web Lib Utils]]
- [[_COMMUNITY_Web Lib Auth|Web Lib Auth]]
- [[_COMMUNITY_Web Lib API|Web Lib API]]
- [[_COMMUNITY_Web Types|Web Types]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 111|Community 111]]

## God Nodes (most connected - your core abstractions)
1. `User` - 51 edges
2. `Post` - 38 edges
3. `useAuthStore` - 29 edges
4. `useTranslation()` - 27 edges
5. `AdminController` - 26 edges
6. `RedisService` - 25 edges
7. `compilerOptions` - 24 edges
8. `FitsAsset` - 22 edges
9. `GalleryService` - 22 edges
10. `GalleryPhoto` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Next.js 前端网页` --integrates--> `火山引擎图像增强`  [INFERRED]
  README.md → packages/server/src/modules/volc/volc.service.ts
- `速率限制` --protects--> `NestJS 后端服务`  [EXTRACTED]
  packages/server/src/common/security/rate-limit.middleware.ts → README.md
- `NestJS 后端服务` --integrates--> `火山引擎图像增强`  [EXTRACTED]
  README.md → packages/server/src/modules/volc/volc.service.ts
- `Apple Touch Icon` --used_by--> `Next.js 前端网页`  [EXTRACTED]
  packages/web/public/apple-touch-icon.png → README.md
- `App Icon 192px` --used_by--> `Next.js 前端网页`  [EXTRACTED]
  packages/web/public/icon-192.png → README.md

## Communities (112 total, 30 thin omitted)

### Community 0 - "Admin Management & Types"
Cohesion: 0.07
Nodes (42): SectionAdmin, adjustPoints(), deleteGallery(), deletePost(), getAllGallery(), getAllPosts(), getLogs(), getPendingEvents() (+34 more)

### Community 1 - "FITS Astrometry Processing"
Cohesion: 0.06
Nodes (42): _get_catalog(), health_check(), restore(), solve(), solve_fits_upload(), _to_2d(), GaiaLiteCatalog, haversine_deg() (+34 more)

### Community 2 - "Project Architecture & Documentation"
Cohesion: 0.06
Nodes (50): 架构决策记录 ADR, 后台管理系统, 天文测量解算器, 腾讯云 COS 图片存储, CSRF 跨站防护, 内容审核系统, 设备数据模块, Docker Compose 部署 (+42 more)

### Community 3 - "Admin Backend (NestJS)"
Cohesion: 0.07
Nodes (6): AdminController, AdminService, AdjustPointsDto, AdminQueryDto, ManageUserDto, ReviewPostDto

### Community 4 - "Taro Miniapp (WeChat)"
Cohesion: 0.07
Nodes (30): STATUS_MAP, GALLERY_CATEGORIES, CATEGORIES, TABS, PostCardProps, authApi, AuthUser, CommentItem (+22 more)

### Community 5 - "Web Frontend Pages"
Cohesion: 0.12
Nodes (23): AdminLayout(), navItems, HomeContent(), Providers(), EventsPage(), GalleryPage(), useTranslation(), Footer() (+15 more)

### Community 6 - "Ads & Map Integration"
Cohesion: 0.11
Nodes (22): AddressPicker(), AddressPickerProps, AddressSelectResult, PoiResult, AdMapViewer(), AdMapViewerProps, AdCard(), MapModal() (+14 more)

### Community 7 - "Web Dependencies"
Cohesion: 0.06
Nodes (30): dependencies, axios, clsx, date-fns, lucide-react, next, next-themes, react (+22 more)

### Community 8 - "Auth Module"
Cohesion: 0.13
Nodes (7): Ad, AdsController, AdsModule, AdsService, DEFAULT_ADS, CreateAdDto, UpdateAdDto

### Community 9 - "Posts & Comments Module"
Cohesion: 0.10
Nodes (9): PointsTransaction, PaginatedResult, PointsService, existingTx, mockManager, mockUser, RedisService, Reward (+1 more)

### Community 10 - "Points System"
Cohesion: 0.07
Nodes (27): dependencies, react, react-dom, @tarojs/cli, @tarojs/components, @tarojs/plugin-framework-react, @tarojs/runtime, @tarojs/taro (+19 more)

### Community 11 - "Gallery Module"
Cohesion: 0.07
Nodes (27): compilerOptions, allowJs, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules (+19 more)

### Community 12 - "Events Module"
Cohesion: 0.12
Nodes (5): CreateEventDto, QueryEventDto, ReviewEventDto, EventsController, EventsService

### Community 13 - "Follows Module"
Cohesion: 0.28
Nodes (11): PaginatedResult, AdminLog, DeviceProcessingTask, DeviceUpload, Event, EventSignup, User, EventsModule (+3 more)

### Community 14 - "Upload Module"
Cohesion: 0.14
Nodes (6): CreatePostDto, ImageItemDto, QueryPostDto, UpdatePostDto, PostsController, PostsService

### Community 15 - "FITS Worker Processing"
Cohesion: 0.19
Nodes (11): FitsAsset, Post, Section, PaginatedResult, adminLogRepo, cosService, createdPhoto, dto (+3 more)

### Community 16 - "Users Module"
Cohesion: 0.12
Nodes (11): CommentsController, CommentsService, PaginatedResult, CreateCommentDto, Comment, commentRepo, createdPost, dto (+3 more)

### Community 17 - "Volc Engine Integration"
Cohesion: 0.19
Nodes (10): defaultModerationKeywords, MODERATION_CATEGORIES, ModerationCategory, ModerationKeywords, ModerationModule, ModerationService, ModerationDetail, ModerationOptions (+2 more)

### Community 18 - "Common Utilities & Security"
Cohesion: 0.12
Nodes (6): VolcController, VolcModule, AiUpscaleResult, EnhanceResult, UploadUrlResult, VolcService

### Community 19 - "Database Entities"
Cohesion: 0.12
Nodes (17): PostDetailPage(), BackendComment, BackendPaginated, createComment(), deleteComment(), getComments(), BackendPaginated, BackendPost (+9 more)

### Community 20 - "Server Config & Module"
Cohesion: 0.14
Nodes (11): AdminModule, AuthModule, CommentsModule, ConfigModule, DatabaseModule, FitsModule, FollowsModule, PostsModule (+3 more)

### Community 21 - "FITS Worker Docker"
Cohesion: 0.14
Nodes (12): inter, metadata, LocaleInitializer(), en, DeepValue, TranslationKey, translations, zh (+4 more)

### Community 22 - "Server Package Config"
Cohesion: 0.10
Nodes (21): dependencies, bcrypt, class-transformer, class-validator, cos-nodejs-sdk-v5, ioredis, multer, @nestjs/common (+13 more)

### Community 23 - "Server Test"
Cohesion: 0.16
Nodes (14): cn(), getUsers(), manageUser(), AdminUser, Avatar(), AvatarProps, sizeStyles, Badge() (+6 more)

### Community 24 - "FITS Worker Dependencies"
Cohesion: 0.15
Nodes (6): FitsCallbackDto, FitsStatusQueryDto, FitsController, FitsService, InternalJwtPayload, verifyInternalToken()

### Community 25 - "Docker Compose"
Cohesion: 0.18
Nodes (5): CreateSectionDto, UpdateSectionDto, SectionsController, SectionsModule, SectionsService

### Community 26 - "Miniapp Config"
Cohesion: 0.10
Nodes (19): compilerOptions, baseUrl, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, lib, module, moduleResolution (+11 more)

### Community 27 - "Shared Types"
Cohesion: 0.16
Nodes (13): Starfield(), LoginMode, login(), loginWithPassword(), normalizeAuthResponse(), register(), sendSmsCode(), wechatLogin() (+5 more)

### Community 28 - "Web Config"
Cohesion: 0.13
Nodes (8): CosModule, CosService, UploadModule, ASTRO_ALLOWED_FORMATS, ASTRO_ALLOWED_MIMES, IMAGE_ALLOWED_FORMATS, IMAGE_ALLOWED_MIMES, MAGIC_NUMBERS

### Community 29 - "Web i18n"
Cohesion: 0.17
Nodes (7): UpdatePrivacyDto, UpdateProfileDto, UsersController, auditFields(), auditText(), findSensitiveWord(), SENSITIVE_WORDS

### Community 30 - "Web Store"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prettier, ts-jest (+11 more)

### Community 31 - "UI Components"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 32 - "Web Auth Service"
Cohesion: 0.11
Nodes (18): description, devDependencies, eslint, prettier, typescript, engines, node, name (+10 more)

### Community 33 - "Fits Asset Entity"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module (+10 more)

### Community 34 - "Device Module Entities"
Cohesion: 0.15
Nodes (14): ProfileContent(), followUser(), getFollowers(), getFollowing(), getFollowStatus(), unfollowUser(), getMe(), getUser() (+6 more)

### Community 35 - "Server-fits Worker"
Cohesion: 0.18
Nodes (5): AuthController, LoginDto, RegisterDto, SendSmsCodeDto, WechatLoginDto

### Community 36 - "Server-fits Preview"
Cohesion: 0.12
Nodes (15): appid, compileType, condition, description, miniprogramRoot, projectname, setting, bigPackageSizeSupport (+7 more)

### Community 38 - "Redis Module"
Cohesion: 0.28
Nodes (7): CurrentUser, ReviewGalleryDto, JwtAuthGuard, ASTRO_EXTENSIONS, ASTRO_MIMES, AiUpscaleDto, EnhanceImageDto

### Community 39 - "Seed Data"
Cohesion: 0.17
Nodes (3): ApplyGalleryDto, QueryGalleryDto, GalleryController

### Community 40 - "Migrations"
Cohesion: 0.19
Nodes (9): getBalance(), getRewards(), getTransactions(), redeem(), Reward, TransactionQuery, Card(), CardProps (+1 more)

### Community 41 - "Web ESLint"
Cohesion: 0.19
Nodes (12): apiClient, token, applyGallery(), BackendGalleryPhoto, BackendPaginated, downloadOriginal(), getGalleryDetail(), getGalleryList() (+4 more)

### Community 42 - "Server ESLint"
Cohesion: 0.14
Nodes (13): extends, ignorePatterns, parser, parserOptions, project, sourceType, plugins, root (+5 more)

### Community 45 - "Nginx Config"
Cohesion: 0.22
Nodes (11): StatusBadge(), BackendEvent, BackendPaginated, cancelSignup(), getEvent(), getEvents(), getMyEvents(), signupEvent() (+3 more)

### Community 46 - "Dockerfile Config"
Cohesion: 0.29
Nodes (3): Follow, FollowsService, PaginatedResult

### Community 48 - "Miniapp Post-card"
Cohesion: 0.26
Nodes (8): CompareViewerProps, extractError(), volcAiUpscale(), volcEnhance(), volcUpload(), ModelResult, MODELS, VolcTestPage()

### Community 49 - "Miniapp Gallery"
Cohesion: 0.17
Nodes (11): description, devDependencies, typescript, main, name, private, scripts, build (+3 more)

### Community 50 - "Miniapp Points"
Cohesion: 0.17
Nodes (11): env, es2022, node, parserOptions, ecmaVersion, sourceType, root, rules (+3 more)

### Community 51 - "Miniapp Events"
Cohesion: 0.25
Nodes (3): QueryTransactionsDto, RedeemDto, PointsController

### Community 53 - "Miniapp Login"
Cohesion: 0.20
Nodes (10): scripts, build, lint, start, start:debug, start:dev, start:prod, test (+2 more)

### Community 54 - "Miniapp Post-detail"
Cohesion: 0.36
Nodes (3): AppController, AppService, result

### Community 55 - "Miniapp Profile"
Cohesion: 0.22
Nodes (9): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+1 more)

### Community 56 - "Miniapp Config Files"
Cohesion: 0.25
Nodes (6): AppDataSource, mockComments, mockGallery, MockPost, mockPosts, mockUsers

### Community 57 - "Miniapp Services"
Cohesion: 0.25
Nodes (7): IApiResponse, ImageFormat, IPaginatedResponse, IPaginationParams, IUser, ProcessingStatus, UserRole

### Community 58 - "Miniapp Auth Store"
Cohesion: 0.39
Nodes (6): getToken(), isAuthenticated(), removeToken(), setToken(), AuthState, User

### Community 60 - "Miniapp App Config"
Cohesion: 0.29
Nodes (4): DEFAULT_CONFIG, RateLimitConfig, RateLimitMiddleware, ROUTE_CONFIGS

### Community 61 - "SMS Verification API"
Cohesion: 0.29
Nodes (6): moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$

### Community 62 - "FITS Technical Design"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 63 - "Deployment Plan"
Cohesion: 0.33
Nodes (5): edges, hyperedges, input_tokens, nodes, output_tokens

### Community 64 - "Devices Spec"
Cohesion: 0.33
Nodes (5): mockConfigService, mockJwtService, mockRedisService, mockUser, mockUsersService

### Community 66 - "Web Volc Test"
Cohesion: 0.33
Nodes (4): AppDataSource, commentTemplates, NewPost, newPosts

### Community 67 - "Fits Compare Viewer"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 68 - "Starfield Effect"
Cohesion: 0.70
Nodes (4): str, main(), query_tap(), write_csv()

### Community 70 - "Locale Initializer"
Cohesion: 0.40
Nodes (4): description, name, private, version

### Community 75 - "Post Detail Page"
Cohesion: 0.50
Nodes (3): int, str, generate_preview()

## Knowledge Gaps
- **433 isolated node(s):** `root`, `node`, `es2022`, `ecmaVersion`, `sourceType` (+428 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RedisService` connect `Posts & Comments Module` to `Devices Spec`, `Root ESLint`, `Web Config`, `FITS Worker Processing`, `Root Config`, `Server Config & Module`, `Miniapp App Config`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `User` connect `Follows Module` to `Admin Backend (NestJS)`, `Sections Module`, `Posts & Comments Module`, `Root Package`, `Dockerfile Config`, `FITS Worker Processing`, `Users Module`, `Server Config & Module`, `Web i18n`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `AdminController` connect `Admin Backend (NestJS)` to `Root Package`, `Follows Module`, `Redis Module`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `root`, `node`, `es2022` to the rest of the system?**
  _433 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Management & Types` be split into smaller, more focused modules?**
  _Cohesion score 0.07080200501253132 - nodes in this community are weakly interconnected._
- **Should `FITS Astrometry Processing` be split into smaller, more focused modules?**
  _Cohesion score 0.06233766233766234 - nodes in this community are weakly interconnected._
- **Should `Project Architecture & Documentation` be split into smaller, more focused modules?**
  _Cohesion score 0.0563265306122449 - nodes in this community are weakly interconnected._