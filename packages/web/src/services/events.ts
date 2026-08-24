import apiClient from '@/lib/api'
import type { EventItem, PaginatedResponse, EventQuery, CreateEventData } from '@/types'

/* 后端返回的活动类型 */
interface BackendEvent {
  id: string
  creatorId: string
  title: string
  description: string
  startTime: string
  endTime: string | null
  locationType: string
  location: string | null
  maxParticipants: number | null
  currentParticipants: number
  status: string
  isOfficial: boolean
  isSignedUp?: boolean
  createdAt: string
  updatedAt: string
  creator?: {
    id: string
    nickname: string
    avatar: string | null
  }
}

interface BackendPaginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/* 转换后端活动格式到前端格式 */
function transformEvent(be: BackendEvent): EventItem {
  return {
    id: be.id,
    title: be.title,
    description: be.description,
    startTime: be.startTime,
    endTime: be.endTime || '',
    locationType: be.locationType as 'online' | 'offline',
    location: be.location || '',
    maxParticipants: be.maxParticipants || 0,
    currentParticipants: be.currentParticipants,
    isOfficial: be.isOfficial,
    status: be.status as 'pending' | 'approved' | 'rejected' | 'ongoing' | 'ended',
    isSignedUp: be.isSignedUp ?? false,
    authorId: be.creatorId,
    authorNickname: be.creator?.nickname || '',
    createdAt: be.createdAt,
  }
}

/* 活动相关 API */

/** 获取活动列表 */
export async function getEvents(query?: EventQuery) {
  const { data } = await apiClient.get<BackendPaginated<BackendEvent>>('/events', { params: query })
  return {
    items: (data.data || []).map(transformEvent),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  } as PaginatedResponse<EventItem>
}

/** 获取活动详情 */
export async function getEvent(id: string) {
  const { data } = await apiClient.get<BackendEvent>(`/events/${id}`)
  return transformEvent(data)
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
  const { data } = await apiClient.delete<{ success: boolean }>(`/events/${id}/signup`)
  return data
}

/** 获取我参加的活动 */
export async function getMyEvents(query?: EventQuery) {
  const { data } = await apiClient.get<BackendPaginated<BackendEvent>>('/events/my', { params: query })
  return {
    items: (data.data || []).map(transformEvent),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  } as PaginatedResponse<EventItem>
}
