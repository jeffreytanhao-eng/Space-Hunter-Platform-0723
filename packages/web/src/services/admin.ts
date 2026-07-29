import apiClient from '@/lib/api'
import type {
  AdminStats, Post, PaginatedResponse, PostQuery,
  GalleryItem, GalleryQuery, EventItem, EventQuery,
  Section, AdminUser, AdminLog, ReviewData,
  ManageSectionData, ManageUserData, AdjustPointsData,
  PointTransaction, TransactionQuery,
} from '@/types'

/* 管理后台 API */

/**
 * 标准化分页响应：后端返回 { data: [...] }，前端使用 { items: [...] }
 */
function normalizePaginated<T>(data: Record<string, unknown>): PaginatedResponse<T> {
  return {
    items: (Array.isArray(data.items) ? data.items : (Array.isArray(data.data) ? data.data : [])) as T[],
    total: (data.total as number) || 0,
    page: (data.page as number) || 1,
    pageSize: (data.pageSize as number) || 20,
  }
}

/** 获取统计数据 */
export async function getStats() {
  const { data } = await apiClient.get<AdminStats>('/admin/stats')
  return data
}

/** 获取待审核帖子 */
export async function getPendingPosts(query?: PostQuery) {
  const { data } = await apiClient.get('/admin/posts/pending', { params: query })
  return normalizePaginated<Post>(data)
}

/** 审核帖子 */
export async function reviewPost(id: string, reviewData: ReviewData) {
  const { data } = await apiClient.post(`/admin/posts/${id}/review`, reviewData)
  return data
}

/** 获取待审核画廊 */
export async function getPendingGallery(query?: GalleryQuery) {
  const { data } = await apiClient.get('/admin/gallery/pending', { params: query })
  return normalizePaginated<GalleryItem>(data)
}

/** 审核画廊 */
export async function reviewGallery(id: string, reviewData: ReviewData) {
  const { data } = await apiClient.post(`/admin/gallery/${id}/review`, reviewData)
  return data
}

/** 获取待审核活动 */
export async function getPendingEvents(query?: EventQuery) {
  const { data } = await apiClient.get('/admin/events/pending', { params: query })
  return normalizePaginated<EventItem>(data)
}

/** 审核活动 */
export async function reviewEvent(id: string, reviewData: ReviewData) {
  const { data } = await apiClient.post(`/admin/events/${id}/review`, reviewData)
  return data
}

/** 获取待审核板块 */
export async function getPendingSections(query?: { page?: number; pageSize?: number }) {
  const { data } = await apiClient.get('/admin/sections/pending', { params: query })
  return normalizePaginated<Section>(data)
}

/** 管理板块 */
export async function manageSection(id: string, sectionData: ManageSectionData) {
  const { data } = await apiClient.patch<Section>(`/admin/sections/${id}`, sectionData)
  return data
}

/** 获取用户列表 */
export async function getUsers(query?: { page?: number; pageSize?: number; keyword?: string }) {
  const { data } = await apiClient.get('/admin/users', { params: query })
  return normalizePaginated<AdminUser>(data)
}

/** 管理用户 */
export async function manageUser(id: string, userData: ManageUserData) {
  const { data } = await apiClient.post(`/admin/users/${id}/manage`, userData)
  return data
}

/** 获取积分流水 */
export async function getPointsTransactions(query?: TransactionQuery) {
  const { data } = await apiClient.get('/admin/points/transactions', { params: query })
  return normalizePaginated<PointTransaction>(data)
}

/** 积分调整 */
export async function adjustPoints(adjustData: AdjustPointsData) {
  const { data } = await apiClient.post('/admin/points/adjust', adjustData)
  return data
}

/** 获取操作日志 */
export async function getLogs(query?: { page?: number; pageSize?: number }) {
  const { data } = await apiClient.get('/admin/logs', { params: query })
  return normalizePaginated<AdminLog>(data)
}
