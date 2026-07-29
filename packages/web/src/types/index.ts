/* 前端类型定义 */

/** 用户信息 */
export interface User {
  id: string
  phone?: string
  username?: string
  nickname: string
  avatar?: string
  email?: string
  bio?: string
  role?: 'user' | 'admin'
  interests?: string[]
  equipment?: string
  points: number
  privacySettings?: PrivacySettings
  createdAt: string
  updatedAt: string
}

/** 隐私设置 */
export interface PrivacySettings {
  showEmail: boolean
  showPhone: boolean
  showEquipment: boolean
}

/** 帖子 */
export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  authorNickname: string
  authorAvatar?: string
  sectionId: string
  sectionName?: string
  tags: string[]
  images?: PostImage[]
  fitsMeta?: FitsMeta
  likesCount: number
  commentsCount: number
  isLiked?: boolean
  createdAt: string
  updatedAt: string
}

/** 帖子图片 */
export interface PostImage {
  id: string
  url: string
  thumbnailUrl?: string
  isFits: boolean
  processingStatus?: 'pending' | 'processing' | 'done' | 'failed'
}

/** FITS 元数据 */
export interface FitsMeta {
  object?: string
  telescope?: string
  exposure?: string
  filter?: string
  dateObs?: string
  resolution?: string
  fileSize?: number
  downloadUrl?: string
}

/** 板块 */
export interface Section {
  id: string
  name: string
  description?: string
  icon?: string
  postsCount: number
  createdAt: string
}

/** 评论 */
export interface Comment {
  id: string
  postId: string
  content: string
  authorId: string
  authorNickname: string
  authorAvatar?: string
  createdAt: string
}

/** 积分交易记录 */
export interface PointTransaction {
  id: string
  type: 'earn' | 'spend'
  amount: number
  reason: string
  createdAt: string
}

/** 奖励 */
export interface Reward {
  id: string
  name: string
  description?: string
  icon?: string
  pointsCost: number
  stock?: number
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** 帖子列表查询参数 */
export interface PostQuery {
  page?: number
  pageSize?: number
  sectionId?: string
  tag?: string
  keyword?: string
}

/** 评论列表查询参数 */
export interface CommentQuery {
  page?: number
  pageSize?: number
}

/** 积分明细查询参数 */
export interface TransactionQuery {
  page?: number
  pageSize?: number
  type?: 'earn' | 'spend'
}

/** 登录/注册响应 */
export interface AuthResponse {
  token: string
  refreshToken: string
  user: User
}

/** 更新资料参数 */
export interface UpdateProfileData {
  nickname?: string
  username?: string
  avatar?: string
  bio?: string
  interests?: string[]
  equipment?: string
}

/** 更新隐私参数 */
export interface UpdatePrivacyData {
  showEmail?: boolean
  showPhone?: boolean
  showEquipment?: boolean
}

/** 发帖参数 */
export interface CreatePostData {
  sectionId: string
  title: string
  content: string
  tags?: string[]
  images?: File[]
}

/** 申请板块参数 */
export interface RequestSectionData {
  name: string
  description: string
}

/** 热门标签 */
export interface HotTag {
  name: string
  count: number
}

/** 活跃用户 */
export interface ActiveUser {
  id: string
  nickname: string
  avatar?: string
  postsCount: number
}

/** 画廊作品 */
export interface GalleryItem {
  id: string
  title: string
  description?: string
  imageUrl: string
  thumbnailUrl?: string
  originalUrl?: string
  authorId: string
  authorNickname: string
  authorAvatar?: string
  category: string
  likesCount: number
  isLiked?: boolean
  fitsMeta?: FitsMeta
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

/** 画廊列表查询参数 */
export interface GalleryQuery {
  page?: number
  pageSize?: number
  category?: string
  sort?: 'time' | 'likes'
  keyword?: string
}

/** 画廊申请参数 */
export interface ApplyGalleryData {
  photoId: string
  title: string
  description?: string
}

/** 关注状态 */
export interface FollowStatus {
  isFollowing: boolean
  followersCount: number
  followingCount: number
}

/** 关注用户信息 */
export interface FollowUser {
  id: string
  nickname: string
  avatar?: string
  bio?: string
  followedAt?: string
}

/** 关注列表查询参数 */
export interface FollowQuery {
  page?: number
  pageSize?: number
}

/** 活动 */
export interface EventItem {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  locationType: 'online' | 'offline'
  location: string
  maxParticipants: number
  currentParticipants: number
  isOfficial: boolean
  status: 'pending' | 'approved' | 'rejected' | 'ongoing' | 'ended'
  isSignedUp?: boolean
  authorId: string
  authorNickname: string
  createdAt: string
}

/** 活动列表查询参数 */
export interface EventQuery {
  page?: number
  pageSize?: number
  status?: string
  keyword?: string
}

/** 创建活动参数 */
export interface CreateEventData {
  title: string
  description: string
  startTime: string
  endTime: string
  locationType: 'online' | 'offline'
  location: string
  maxParticipants: number
}

/** 管理后台统计 */
export interface AdminStats {
  totalUsers: number
  totalPosts: number
  totalGallery: number
  totalEvents: number
  todayNewUsers: number
  todayNewPosts: number
  pendingPosts: number
  pendingGallery: number
  pendingEvents: number
  pendingSections: number
}

/** 审核操作参数 */
export interface ReviewData {
  action: 'approve' | 'reject'
  reason?: string
}

/** 板块管理参数 */
export interface ManageSectionData {
  name?: string
  description?: string
  enabled?: boolean
  sortOrder?: number
}

/** 用户管理参数 */
export interface ManageUserData {
  banned?: boolean
  role?: string
  pointsAdjust?: number
  reason?: string
}

/** 积分调整参数 */
export interface AdjustPointsData {
  userId: string
  amount: number
  reason: string
}

/** 操作日志 */
export interface AdminLog {
  id: string
  operatorId: string
  operatorNickname: string
  action: string
  target: string
  detail?: string
  createdAt: string
}

/** 管理用户信息 */
export interface AdminUser {
  id: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  role: string
  points: number
  banned: boolean
  createdAt: string
}

/** 关注动态项 */
export interface FollowFeedItem {
  id: string
  type: 'post' | 'gallery'
  title: string
  content?: string
  imageUrl?: string
  thumbnailUrl?: string
  authorId: string
  authorNickname: string
  authorAvatar?: string
  likesCount: number
  commentsCount?: number
  createdAt: string
}

/** 关注动态查询参数 */
export interface FollowFeedQuery {
  page?: number
  pageSize?: number
}
