import apiClient from '@/lib/api'
import type { GalleryItem, PaginatedResponse, GalleryQuery, ApplyGalleryData } from '@/types'

/* 画廊相关 API */

/** 获取画廊列表 */
export async function getGalleryList(query?: GalleryQuery) {
  const { data } = await apiClient.get<PaginatedResponse<GalleryItem>>('/gallery', { params: query })
  return data
}

/** 获取画廊详情 */
export async function getGalleryDetail(id: string) {
  const { data } = await apiClient.get<GalleryItem>(`/gallery/${id}`)
  return data
}

/** 申请进入画廊 */
export async function applyGallery(applyData: ApplyGalleryData) {
  const { data } = await apiClient.post<GalleryItem>('/gallery/apply', applyData)
  return data
}

/** 下载原始文件 */
export async function downloadOriginal(id: string) {
  const { data } = await apiClient.get<{ url: string }>(`/gallery/${id}/download`)
  return data
}
