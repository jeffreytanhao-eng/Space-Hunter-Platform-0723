import apiClient from '@/lib/api'
import type { Comment, PaginatedResponse, CommentQuery } from '@/types'

interface BackendComment {
  id: string
  postId: string
  userId: string
  content: string
  createdAt: string
  user?: {
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

function transformComment(bc: BackendComment): Comment {
  return {
    id: bc.id,
    postId: bc.postId,
    authorId: bc.userId,
    authorNickname: bc.user?.nickname || '',
    authorAvatar: bc.user?.avatar || undefined,
    content: bc.content,
    createdAt: bc.createdAt,
  }
}

/** 获取评论列表 */
export async function getComments(postId: string, query?: CommentQuery) {
  const { data } = await apiClient.get<BackendPaginated<BackendComment>>(`/posts/${postId}/comments`, {
    params: query,
  })
  return {
    items: (data.data || []).map(transformComment),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  } as PaginatedResponse<Comment>
}

/** 发表评论 */
export async function createComment(postId: string, content: string) {
  const { data } = await apiClient.post<Comment>(`/posts/${postId}/comments`, { content })
  return data
}

/** 删除评论 */
export async function deleteComment(id: string) {
  await apiClient.delete(`/comments/${id}`)
}
