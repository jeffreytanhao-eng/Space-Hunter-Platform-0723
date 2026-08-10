import apiClient from '@/lib/api'
import type { NotificationItem, PaginatedResponse } from '@/types'

/* 站内通知相关 API */

interface BackendNotification {
  id: string
  type: string
  title: string
  content?: string
  isRead?: boolean
  read?: boolean
  createdAt: string
}

interface BackendPaginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/* 转换后端通知格式到前端格式 */
function transformNotification(bn: BackendNotification): NotificationItem {
  return {
    id: bn.id,
    type: bn.type,
    title: bn.title,
    content: bn.content,
    isRead: bn.isRead ?? bn.read ?? false,
    createdAt: bn.createdAt,
  }
}

/** 获取通知列表（分页） */
export async function getNotifications(query?: { page?: number; pageSize?: number }) {
  const { data } = await apiClient.get<BackendPaginated<BackendNotification>>('/notifications', { params: query })
  return {
    items: (data.data || []).map(transformNotification),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  } as PaginatedResponse<NotificationItem>
}

/** 获取未读数 */
export async function getUnreadCount() {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count')
  return data.count
}

/** 全部标为已读 */
export async function markAllRead() {
  await apiClient.post('/notifications/read-all')
}

/** 单条标为已读 */
export async function markRead(id: string) {
  await apiClient.post(`/notifications/${id}/read`)
}
