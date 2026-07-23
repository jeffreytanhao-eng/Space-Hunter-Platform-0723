import apiClient from '@/lib/api'
import type { AuthResponse } from '@/types'

/* 认证相关 API */

/** 注册 */
export async function register(phone: string, code: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', { phone, code })
  return data
}

/** 登录 */
export async function login(phone: string, code: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { phone, code })
  return data
}

/** 发送验证码 */
export async function sendSmsCode(phone: string) {
  const { data } = await apiClient.post('/auth/sms-code', { phone })
  return data
}

/** 微信登录 */
export async function wechatLogin(code: string, type: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/wechat', { code, type })
  return data
}

/** 刷新 token */
export async function refreshToken() {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
  const { data } = await apiClient.post<{ token: string; refreshToken: string }>('/auth/refresh', {
    refreshToken,
  })
  return data
}

/** 登出 */
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
  }
}
