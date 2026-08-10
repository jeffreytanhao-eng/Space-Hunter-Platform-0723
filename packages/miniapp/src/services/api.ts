import Taro from '@tarojs/taro'
import { request, BASE_URL } from '@/utils/request'
import { getToken } from '@/stores/auth'

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
  createPost: (data: { title: string; content: string; sectionId: string; images?: PostImage[]; tags?: string[] }) =>
    request.post<PostItem>(`${API}/posts`, data as Record<string, unknown>),

  /** 点赞帖子 */
  likePost: (id: string) =>
    request.post(`${API}/posts/${id}/like`),

  /** 评论帖子 */
  commentPost: (id: string, content: string) =>
    request.post(`${API}/posts/${id}/comments`, { content }),
}

// ==================== 板块相关 ====================

export const sectionsApi = {
  /** 获取板块列表（仅已审核） */
  getSections: () =>
    request.get<SectionItem[]>(`${API}/sections`),
}

// ==================== 上传相关 ====================

export const uploadApi = {
  /**
   * 上传图片（multipart/form-data）
   * 后端返回普通图片: { type: 'image', url }
   */
  uploadImage: (filePath: string): Promise<UploadResult> => {
    const token = getToken()
    return Taro.uploadFile({
      url: `${BASE_URL}${API}/upload`,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((res) => {
      let parsed: any
      try {
        parsed = JSON.parse(res.data)
      } catch {
        parsed = null
      }
      // 兼容后端统一响应 { code, data, message } 与直接返回 { url, type }
      let result = parsed
      if (parsed && typeof parsed === 'object' && parsed.data !== undefined) {
        result = parsed.data
      }
      if (res.statusCode >= 400 || !result || !result.url) {
        const msg = parsed?.message || '图片上传失败'
        Taro.showToast({ title: msg, icon: 'none', duration: 2000 })
        throw new Error(msg)
      }
      return result as UploadResult
    })
  },
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

// ==================== 每日签到相关 ====================

export const checkinApi = {
  /** 每日签到 */
  checkin: () =>
    request.post<CheckinResult>(`${API}/points/checkin`),

  /** 查询今日签到状态 */
  getStatus: () =>
    request.get<CheckinStatus>(`${API}/points/checkin/status`),
}

// ==================== 收藏相关 ====================

export const favoritesApi = {
  /** 收藏帖子/画廊 */
  add: (data: { targetType: 'post' | 'gallery'; targetId: string }) =>
    request.post<{ favorited: boolean }>(`${API}/favorites`, data as Record<string, unknown>),

  /** 取消收藏帖子/画廊 */
  remove: (targetType: 'post' | 'gallery', targetId: string) =>
    request.delete<{ favorited: boolean }>(`${API}/favorites/${targetType}/${targetId}`),

  /** 我的收藏列表（分页） */
  getFavorites: (params: { targetType?: 'post' | 'gallery'; page?: number; pageSize?: number }) =>
    request.get<FavoriteListResult>(`${API}/favorites`, params as Record<string, unknown>),
}

// ==================== 私信相关 ====================

export const messagesApi = {
  /** 会话列表 */
  getConversations: () =>
    request.get<ConversationItem[]>(`${API}/messages/conversations`),

  /** 发起会话（不存在则创建） */
  createConversation: (peerId: string) =>
    request.post<ConversationItem>(`${API}/messages/conversations`, { peerId }),

  /** 获取会话消息列表（GET 时后端会标记当前用户未读为已读） */
  getMessages: (conversationId: string) =>
    request.get<MessageItem[]>(`${API}/messages/conversations/${conversationId}`),

  /** 发送消息 */
  sendMessage: (conversationId: string, content: string) =>
    request.post<MessageItem>(`${API}/messages/conversations/${conversationId}`, { content }),
}

// ==================== 通知相关 ====================

export const notificationsApi = {
  /** 通知列表（分页） */
  getNotifications: (params: { page?: number; pageSize?: number }) =>
    request.get<NotificationListResult>(`${API}/notifications`, params as Record<string, unknown>),

  /** 未读通知数 */
  getUnreadCount: () =>
    request.get<{ count: number }>(`${API}/notifications/unread-count`),

  /** 全部标记已读 */
  readAll: () =>
    request.post(`${API}/notifications/read-all`),

  /** 单条标记已读 */
  markRead: (id: string) =>
    request.post(`${API}/notifications/${id}/read`),
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
    request.post(`${API}/users/${userId}/follow`),

  /** 取消关注 */
  unfollowUser: (userId: string) =>
    request.delete(`${API}/users/${userId}/follow`),

  /** 获取关注状态 */
  getFollowStatus: (userId: string) =>
    request.get<{ following: boolean }>(`${API}/users/${userId}/follow-status`),

  /** 获取粉丝列表（分页） */
  getFollowers: (userId: string, params?: { page?: number; pageSize?: number }) =>
    request.get<FollowListResult>(`${API}/users/${userId}/followers`, params as Record<string, unknown>),

  /** 获取关注列表（分页） */
  getFollowing: (userId: string, params?: { page?: number; pageSize?: number }) =>
    request.get<FollowListResult>(`${API}/users/${userId}/following`, params as Record<string, unknown>),
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

/** 关注列表中的用户 */
export interface FollowUser {
  id: string
  nickname?: string
  username: string
  avatar?: string
}

/** 关注/粉丝列表项（后端返回的 Follow 记录） */
export interface FollowListItem {
  id: string
  follower?: FollowUser
  following?: FollowUser
  createdAt?: string
}

/** 关注/粉丝分页结果 */
export interface FollowListResult {
  data: FollowListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 帖子图片项 */
export interface PostImage {
  url: string
  type: 'image' | 'fits'
  jobId?: string
}

/** 上传结果 */
export interface UploadResult {
  type: 'image' | 'fits'
  url: string
  jobId?: string
  status?: string
}

/** 板块项 */
export interface SectionItem {
  id: string
  name: string
  description?: string
  icon?: string
  sortOrder?: number
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
  isFavorited?: boolean
  favoriteCount?: number
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

/** 签到结果 */
export interface CheckinResult {
  checked: boolean
  points: number
  streak: number
  total: number
}

/** 签到状态 */
export interface CheckinStatus {
  checkedToday: boolean
  streak: number
  total: number
}

/** 收藏项 */
export interface FavoriteItem {
  id: string
  targetType: 'post' | 'gallery'
  targetId: string
  target?: PostItem | GalleryItem
  createdAt: string
}

/** 收藏分页结果 */
export interface FavoriteListResult {
  data: FavoriteItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 私信会话 */
export interface ConversationItem {
  id: string
  peer: AuthUser
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number
}

/** 私信消息 */
export interface MessageItem {
  id: string
  senderId: string
  content: string
  createdAt: string
}

/** 通知项 */
export interface NotificationItem {
  id: string
  type: string
  title?: string
  content: string
  read: boolean
  createdAt: string
}

/** 通知分页结果 */
export interface NotificationListResult {
  data: NotificationItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
