import { request } from '@/utils/request'

const API = '/api'

// ==================== 认证相关 ====================

export const authApi = {
  /** 手机号+验证码登录 */
  login: (phone: string, code: string) =>
    request.post<{ token: string; user: AuthUser }>(`${API}/auth/login`, { phone, code }),

  /** 发送短信验证码 */
  sendSmsCode: (phone: string) =>
    request.post(`${API}/auth/sms-code`, { phone }),

  /** 微信登录 */
  wechatLogin: (code: string) =>
    request.post<{ token: string; user: AuthUser }>(`${API}/auth/wechat-login`, { code }),
}

// ==================== 帖子相关 ====================

export const postsApi = {
  /** 获取帖子列表 */
  getPosts: (params: { page?: number; pageSize?: number; category?: string }) =>
    request.get<{ list: PostItem[]; total: number }>(`${API}/posts`, params as Record<string, unknown>),

  /** 获取帖子详情 */
  getPost: (id: string) =>
    request.get<PostDetail>(`${API}/posts/${id}`),

  /** 创建帖子 */
  createPost: (data: { title: string; content: string; category?: string; images?: string[] }) =>
    request.post<PostItem>(`${API}/posts`, data as Record<string, unknown>),

  /** 点赞帖子 */
  likePost: (id: string) =>
    request.post(`${API}/posts/${id}/like`),

  /** 评论帖子 */
  commentPost: (id: string, content: string) =>
    request.post(`${API}/posts/${id}/comments`, { content }),
}

// ==================== 画廊相关 ====================

export const galleryApi = {
  /** 获取画廊列表 */
  getGalleryList: (params: { page?: number; pageSize?: number; category?: string }) =>
    request.get<{ list: GalleryItem[]; total: number }>(`${API}/gallery`, params as Record<string, unknown>),

  /** 获取画廊详情 */
  getGalleryDetail: (id: string) =>
    request.get<GalleryItem>(`${API}/gallery/${id}`),
}

// ==================== 积分相关 ====================

export const pointsApi = {
  /** 获取积分余额 */
  getBalance: () =>
    request.get<{ balance: number }>(`${API}/points/balance`),

  /** 获取积分明细 */
  getTransactions: (params: { page?: number; pageSize?: number }) =>
    request.get<{ list: TransactionItem[]; total: number }>(`${API}/points/transactions`, params as Record<string, unknown>),

  /** 获取可兑换奖品 */
  getRewards: (params?: { page?: number; pageSize?: number }) =>
    request.get<{ list: RewardItem[]; total: number }>(`${API}/points/rewards`, params as Record<string, unknown>),

  /** 兑换奖品 */
  redeem: (rewardId: string) =>
    request.post(`${API}/points/redeem`, { rewardId }),
}

// ==================== 活动相关 ====================

export const eventsApi = {
  /** 获取活动列表 */
  getEvents: (params?: { page?: number; pageSize?: number }) =>
    request.get<{ list: EventItem[]; total: number }>(`${API}/events`, params as Record<string, unknown>),

  /** 获取活动详情 */
  getEvent: (id: string) =>
    request.get<EventDetail>(`${API}/events/${id}`),

  /** 报名活动 */
  signupEvent: (id: string) =>
    request.post(`${API}/events/${id}/signup`),

  /** 获取我报名的活动 */
  getMyEvents: (params?: { page?: number; pageSize?: number }) =>
    request.get<{ list: EventItem[]; total: number }>(`${API}/events/my`, params as Record<string, unknown>),
}

// ==================== 关注相关 ====================

export const followsApi = {
  /** 关注用户 */
  followUser: (userId: string) =>
    request.post(`${API}/follows/${userId}`),

  /** 取消关注 */
  unfollowUser: (userId: string) =>
    request.delete(`${API}/follows/${userId}`),

  /** 获取关注状态 */
  getFollowStatus: (userId: string) =>
    request.get<{ isFollowing: boolean }>(`${API}/follows/${userId}/status`),
}

// ==================== 用户相关 ====================

export const usersApi = {
  /** 获取当前用户信息 */
  getMe: () =>
    request.get<AuthUser>(`${API}/users/me`),

  /** 更新用户资料 */
  updateProfile: (data: { nickname?: string; avatar?: string; bio?: string }) =>
    request.put<AuthUser>(`${API}/users/me`, data as Record<string, unknown>),
}

// ==================== 类型定义 ====================

/** 用户信息 */
export interface AuthUser {
  id: string
  username: string
  nickname?: string
  avatar?: string
  bio?: string
  role: string
  points?: number
  followCount?: number
  followerCount?: number
  postCount?: number
}

/** 帖子列表项 */
export interface PostItem {
  id: string
  title: string
  content: string
  author: AuthUser
  category: string
  coverUrl?: string
  likeCount: number
  commentCount: number
  createdAt: string
}

/** 帖子详情 */
export interface PostDetail extends PostItem {
  images?: string[]
  comments: CommentItem[]
  isLiked: boolean
}

/** 评论 */
export interface CommentItem {
  id: string
  content: string
  author: AuthUser
  createdAt: string
  likeCount: number
}

/** 画廊项 */
export interface GalleryItem {
  id: string
  title: string
  imageUrl: string
  thumbnailUrl?: string
  author: AuthUser
  category: string
  description?: string
  likeCount: number
  createdAt: string
}

/** 积分明细 */
export interface TransactionItem {
  id: string
  type: 'earn' | 'spend'
  amount: number
  description: string
  createdAt: string
}

/** 兑换奖品 */
export interface RewardItem {
  id: string
  name: string
  description: string
  imageUrl: string
  pointsCost: number
  stock: number
}

/** 活动列表项 */
export interface EventItem {
  id: string
  title: string
  coverUrl: string
  startTime: string
  endTime: string
  location: string
  status: 'upcoming' | 'ongoing' | 'ended'
  signupCount: number
  maxParticipants?: number
}

/** 活动详情 */
export interface EventDetail extends EventItem {
  description: string
  isSignedUp: boolean
  organizer: AuthUser
}
