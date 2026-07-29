import apiClient from '@/lib/api'
import type { AuthResponse } from '@/types'

/* 认证相关 API */

/** 注册 */
export async function register(phone: string, code: string): Promise<AuthResponse> {
  const { data } = await apiClient.post('/auth/register', { phone, code })
  return normalizeAuthResponse(data)
}

/** 登录（手机号+验证码） */
export async function login(phone: string, code: string): Promise<AuthResponse> {
  const { data } = await apiClient.post('/auth/login', { phone, code })
  return normalizeAuthResponse(data)
}

/** 登录（用户名+密码） */
export async function loginWithPassword(username: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post('/auth/login-password', { username, password })
  return normalizeAuthResponse(data)
}

/**
 * 统一后端响应字段：后端返回 access_token/refresh_token，前端使用 token/refreshToken
 */
function normalizeAuthResponse(data: Record<string, unknown>): AuthResponse {
  return {
    token: (data.token as string) || (data.access_token as string) || '',
    refreshToken: (data.refreshToken as string) || (data.refresh_token as string) || '',
    user: data.user as AuthResponse['user'],
  }
}

/** 发送验证码 */
export async function sendSmsCode(phone: string) {
  const { data } = await apiClient.post('/auth/sms-code', { phone })
  return data
}

/** 微信登录 */
export async function wechatLogin(code: string, type: string): Promise<AuthResponse> {
  const { data } = await apiClient.post('/auth/wechat', { code, type })
  return normalizeAuthResponse(data)
}

/** 刷新 token */
export async function refreshToken() {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
  const { data } = await apiClient.post<{ token: string; refreshToken: string; access_token?: string; refresh_token?: string }>('/auth/refresh', {
    refreshToken,
  })
  return {
    token: data.token || data.access_token || '',
    refreshToken: data.refreshToken || data.refresh_token || '',
  }
}

/** 登出 */
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
  }
}
