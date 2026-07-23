import apiClient from '@/lib/api'
import type { FollowStatus, FollowUser, PaginatedResponse, FollowQuery, FollowFeedItem, FollowFeedQuery } from '@/types'

/* 关注相关 API */

/** 关注用户 */
export async function followUser(userId: string) {
  const { data } = await apiClient.post<{ success: boolean }>(`/users/${userId}/follow`)
  return data
}

/** 取消关注 */
export async function unfollowUser(userId: string) {
  const { data } = await apiClient.post<{ success: boolean }>(`/users/${userId}/unfollow`)
  return data
}

/** 获取粉丝列表 */
export async function getFollowers(userId: string, query?: FollowQuery) {
  const { data } = await apiClient.get<PaginatedResponse<FollowUser>>(`/users/${userId}/followers`, { params: query })
  return data
}

/** 获取关注列表 */
export async function getFollowing(userId: string, query?: FollowQuery) {
  const { data } = await apiClient.get<PaginatedResponse<FollowUser>>(`/users/${userId}/following`, { params: query })
  return data
}

/** 获取关注状态 */
export async function getFollowStatus(userId: string) {
  const { data } = await apiClient.get<FollowStatus>(`/users/${userId}/follow-status`)
  return data
}

/** 获取关注动态流 */
export async function getFollowFeed(query?: FollowFeedQuery) {
  const { data } = await apiClient.get<PaginatedResponse<FollowFeedItem>>('/follow/feed', { params: query })
  return data
}
