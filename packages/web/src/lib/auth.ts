/* 认证工具函数（占位） */

/** 获取存储的 token */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

/** 设置 token */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
}

/** 移除 token */
export function removeToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
}

/** 判断是否已登录 */
export function isAuthenticated(): boolean {
  return !!getToken()
}