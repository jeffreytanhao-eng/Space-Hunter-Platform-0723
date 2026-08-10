import apiClient from '@/lib/api'
import type { GalleryItem, PaginatedResponse, GalleryQuery, ApplyGalleryData } from '@/types'

/* 后端返回的画廊类型 */
interface BackendGalleryPhoto {
  id: string
  userId: string
  postId: string | null
  title: string
  description: string | null
  imageUrl: string
  originalUrl: string | null
  thumbnailUrl: string | null
  metadata: any
  category: string
  status: string
  pointsAwarded: number
  likeCount: number
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    nickname: string
    avatar: string | null
  }
  isFavorited?: boolean
  favoriteCount?: number
}

export type { BackendGalleryPhoto }

interface BackendPaginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/* 转换后端画廊格式到前端格式 */
export function transformGalleryPhoto(bp: BackendGalleryPhoto): GalleryItem {
  return {
    id: bp.id,
    title: bp.title,
    description: bp.description || undefined,
    imageUrl: bp.imageUrl,
    thumbnailUrl: bp.thumbnailUrl || undefined,
    originalUrl: bp.originalUrl || undefined,
    authorId: bp.userId,
    authorNickname: bp.user?.nickname || '',
    authorAvatar: bp.user?.avatar || undefined,
    category: bp.category,
    likesCount: bp.likeCount,
    isLiked: false,
    isFavorited: bp.isFavorited,
    favoriteCount: bp.favoriteCount,
    fitsMeta: bp.metadata ? bp.metadata : undefined,
    status: bp.status as 'pending' | 'approved' | 'rejected' | 'hidden',
    createdAt: bp.createdAt,
    updatedAt: bp.updatedAt,
  }
}

/* 画廊相关 API */

/** 获取画廊列表 */
export async function getGalleryList(query?: GalleryQuery) {
  const params: Record<string, any> = {
    page: query?.page,
    pageSize: query?.pageSize,
    category: query?.category,
    sortBy: query?.sort,
    keyword: query?.keyword,
  }
  const { data } = await apiClient.get<BackendPaginated<BackendGalleryPhoto>>('/gallery', { params })
  return {
    items: (data.data || []).map(transformGalleryPhoto),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  } as PaginatedResponse<GalleryItem>
}

/** 获取画廊详情 */
export async function getGalleryDetail(id: string) {
  const { data } = await apiClient.get<BackendGalleryPhoto>(`/gallery/${id}`)
  return transformGalleryPhoto(data)
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

/** 画廊点赞切换 */
export async function toggleGalleryLike(id: string) {
  const { data } = await apiClient.post<{ liked: boolean; likesCount: number }>(`/gallery/${id}/like`)
  return data
}
