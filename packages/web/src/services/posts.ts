import apiClient from '@/lib/api'
import type { Post, PaginatedResponse, PostQuery, CreatePostData } from '@/types'

/* 后端返回的帖子类型 */
interface BackendPost {
  id: string
  userId: string
  sectionId: string
  title: string
  content: string
  images: { url: string; type: 'image' | 'fits'; jobId?: string }[] | null
  tags: string[] | null
  hasFits: boolean
  status: string
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    nickname: string
    avatar: string | null
  }
  section?: {
    id: string
    name: string
  }
  isFavorited?: boolean
  favoriteCount?: number
}

export type { BackendPost }

interface BackendPaginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/* 转换后端帖子格式到前端格式 */
export function transformPost(bp: BackendPost): Post {
  const tags = Array.isArray(bp.tags) ? bp.tags : []
  const images = Array.isArray(bp.images) ? bp.images : []
  return {
    id: bp.id,
    title: bp.title,
    content: bp.content,
    authorId: bp.userId,
    authorNickname: bp.user?.nickname || '',
    authorAvatar: bp.user?.avatar || undefined,
    sectionId: bp.sectionId,
    sectionName: bp.section?.name,
    status: bp.status,
    tags,
    images: images.map((img) => ({
      id: img.url,
      url: img.url,
      thumbnailUrl: img.url,
      isFits: img.type === 'fits',
      processingStatus: img.type === 'fits' ? ('done' as const) : undefined,
    })),
    likesCount: bp.likeCount,
    commentsCount: bp.commentCount,
    isFavorited: bp.isFavorited,
    favoriteCount: bp.favoriteCount,
    createdAt: bp.createdAt,
    updatedAt: bp.updatedAt,
  }
}

/* 帖子相关 API */

/** 获取帖子列表 */
export async function getPosts(query?: PostQuery) {
  const { data } = await apiClient.get<BackendPaginated<BackendPost>>('/posts', { params: query })
  return {
    items: (data.data || []).map(transformPost),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  } as PaginatedResponse<Post>
}

/** 获取帖子详情 */
export async function getPost(id: string) {
  const { data } = await apiClient.get<BackendPost>(`/posts/${id}`)
  return transformPost(data)
}

/** 发帖 */
export async function createPost(postData: CreatePostData) {
  // 先上传图片，获取 URL
  let imageItems: { url: string; type: 'image' | 'fits' }[] | undefined

  if (postData.images && postData.images.length > 0) {
    imageItems = []
    for (const file of postData.images) {
      const formData = new FormData()
      formData.append('file', file)
      const { data: uploadRes } = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const isFits = /\.(fits|fit|fts|tiff|tif|raw|cr2|nef|arw)$/i.test(file.name)
      imageItems.push({
        url: uploadRes.url,
        type: isFits ? 'fits' : 'image',
      })
    }
  }

  const { data } = await apiClient.post<Post>('/posts', {
    sectionId: postData.sectionId,
    title: postData.title,
    content: postData.content,
    tags: postData.tags,
    images: imageItems,
  })
  return data
}

/** 编辑帖子 */
export async function updatePost(id: string, updateData: Partial<CreatePostData>) {
  const { data } = await apiClient.patch<Post>(`/posts/${id}`, updateData)
  return data
}

/** 删除帖子 */
export async function deletePost(id: string) {
  await apiClient.delete(`/posts/${id}`)
}

/** 点赞切换 */
export async function toggleLike(id: string) {
  const { data } = await apiClient.post<{ liked: boolean; likesCount: number }>(`/posts/${id}/like`)
  return data
}
