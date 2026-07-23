import apiClient from '@/lib/api'
import type { Post, PaginatedResponse, PostQuery, CreatePostData } from '@/types'

/* 帖子相关 API */

/** 获取帖子列表 */
export async function getPosts(query?: PostQuery) {
  const { data } = await apiClient.get<PaginatedResponse<Post>>('/posts', { params: query })
  return data
}

/** 获取帖子详情 */
export async function getPost(id: string) {
  const { data } = await apiClient.get<Post>(`/posts/${id}`)
  return data
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
