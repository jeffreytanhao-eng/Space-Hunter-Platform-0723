import apiClient from '@/lib/api'
import type { EventItem, PaginatedResponse, EventQuery, CreateEventData } from '@/types'

/* 活动相关 API */

/** 获取活动列表 */
export async function getEvents(query?: EventQuery) {
  const { data } = await apiClient.get<PaginatedResponse<EventItem>>('/events', { params: query })
  return data
}

/** 获取活动详情 */
export async function getEvent(id: string) {
  const { data } = await apiClient.get<EventItem>(`/events/${id}`)
  return data
}

/** 创建活动 */
export async function createEvent(eventData: CreateEventData) {
  const { data } = await apiClient.post<EventItem>('/events', eventData)
  return data
}

/** 报名活动 */
export async function signupEvent(id: string) {
  const { data } = await apiClient.post<{ success: boolean }>(`/events/${id}/signup`)
  return data
}

/** 取消报名 */
export async function cancelSignup(id: string) {
  const { data } = await apiClient.post<{ success: boolean }>(`/events/${id}/cancel-signup`)
  return data
}

/** 获取我参加的活动 */
export async function getMyEvents(query?: EventQuery) {
  const { data } = await apiClient.get<PaginatedResponse<EventItem>>('/events/my', { params: query })
  return data
}
