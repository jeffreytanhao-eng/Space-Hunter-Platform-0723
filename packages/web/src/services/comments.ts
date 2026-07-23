import apiClient from '@/lib/api'
import type { Comment, PaginatedResponse, CommentQuery } from '@/types'

/* 评论相关 API */

/** 获取评论列表 */
export async function getComments(postId: string, query?: CommentQuery) {
  const { data } = await apiClient.get<PaginatedResponse<Comment>>(`/posts/${postId}/comments`, {
    params: query,
  })
  return data
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
