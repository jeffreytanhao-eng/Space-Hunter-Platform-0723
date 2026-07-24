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
}

interface BackendPaginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/* 转换后端帖子格式到前端格式 */
function transformPost(bp: BackendPost): Post {
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
  // 如果有图片文件，使用 FormData
  if (postData.images && postData.images.length > 0) {
    const formData = new FormData()
    formData.append('sectionId', postData.sectionId)
    formData.append('title', postData.title)
    formData.append('content', postData.content)
    if (postData.tags) {
      formData.append('tags', JSON.stringify(postData.tags))
    }
    postData.images.forEach((file) => {
      formData.append('images', file)
    })
    const { data } = await apiClient.post<Post>('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  const { data } = await apiClient.post<Post>('/posts', postData)
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
