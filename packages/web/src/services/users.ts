import apiClient from '@/lib/api'
import type { User, UpdateProfileData, UpdatePrivacyData } from '@/types'

/* 用户相关 API */

/** 获取当前用户信息 */
export async function getMe() {
  const { data } = await apiClient.get<User>('/users/me')
  return data
}

/** 更新个人资料（含昵称、用户名、头像、简介、兴趣、设备） */
export async function updateProfile(updateData: UpdateProfileData) {
  const { data } = await apiClient.put<User>('/users/me', updateData)
  return data
}

/** 设置/修改密码 */
export async function updatePassword(newPassword: string, oldPassword?: string) {
  const { data } = await apiClient.put('/users/me/password', { newPassword, oldPassword })
  return data
}

/** 更新隐私设置 */
export async function updatePrivacy(privacyData: UpdatePrivacyData) {
  const { data } = await apiClient.put<User>('/users/me/privacy', privacyData)
  return data
}

/** 获取用户公开资料 */
export async function getUser(id: string) {
  const { data } = await apiClient.get<User>(`/users/${id}`)
  return data
}

/** 上传头像：先上传图片到 /upload，再更新用户 avatar 字段 */
export async function uploadAvatar(file: File) {
  // 1. 上传图片文件
  const formData = new FormData()
  formData.append('file', file)
  const { data: uploadRes } = await apiClient.post<{ type: string; url: string }>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  // 2. 更新用户 avatar
  const { data: updatedUser } = await apiClient.put<User>('/users/me', { avatar: uploadRes.url })
  return { url: uploadRes.url, user: updatedUser }
}
