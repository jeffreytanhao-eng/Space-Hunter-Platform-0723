import apiClient from '@/lib/api'
import type { User, UpdateProfileData, UpdatePrivacyData } from '@/types'

/* 用户相关 API */

/** 获取当前用户信息 */
export async function getMe() {
  const { data } = await apiClient.get<User>('/users/me')
  return data
}

/** 更新个人资料 */
export async function updateProfile(updateData: UpdateProfileData) {
  const { data } = await apiClient.patch<User>('/users/me/profile', updateData)
  return data
}

/** 更新隐私设置 */
export async function updatePrivacy(privacyData: UpdatePrivacyData) {
  const { data } = await apiClient.patch<User>('/users/me/privacy', privacyData)
  return data
}

/** 获取用户公开资料 */
export async function getUser(id: string) {
  const { data } = await apiClient.get<User>(`/users/${id}`)
  return data
}

/** 上传头像 */
export async function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('avatar', file)
  const { data } = await apiClient.post<{ url: string }>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
