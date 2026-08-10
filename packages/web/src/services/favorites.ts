import apiClient from '@/lib/api'
import type { PaginatedResponse, FavoriteTargetType } from '@/types'
import { transformPost, type BackendPost } from './posts'
import { transformGalleryPhoto, type BackendGalleryPhoto } from './gallery'

/* 收藏相关 API */

interface BackendPaginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 添加收藏 */
export async function addFavorite(targetType: FavoriteTargetType, targetId: string) {
  const { data } = await apiClient.post<{ favorited: boolean }>('/favorites', { targetType, targetId })
  return data
}

/** 取消收藏 */
export async function removeFavorite(targetType: FavoriteTargetType, targetId: string) {
  const { data } = await apiClient.delete<{ favorited: boolean }>(`/favorites/${targetType}/${targetId}`)
  return data
}

/** 我收藏的帖子 */
export async function getFavoritePosts(query?: { page?: number; pageSize?: number }) {
  const { data } = await apiClient.get<BackendPaginated<BackendPost>>('/favorites', {
    params: { targetType: 'post', ...query },
  })
  return {
    items: (data.data || []).map(transformPost),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  } as PaginatedResponse<ReturnType<typeof transformPost>>
}

/** 我收藏的画廊作品 */
export async function getFavoriteGallery(query?: { page?: number; pageSize?: number }) {
  const { data } = await apiClient.get<BackendPaginated<BackendGalleryPhoto>>('/favorites', {
    params: { targetType: 'gallery', ...query },
  })
  return {
    items: (data.data || []).map(transformGalleryPhoto),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  } as PaginatedResponse<ReturnType<typeof transformGalleryPhoto>>
}
