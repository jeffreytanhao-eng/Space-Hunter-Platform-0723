import Taro from '@tarojs/taro'
import type { AuthUser } from '@/services/api'

const TOKEN_KEY = 'space_hunter_token'
const USER_KEY = 'space_hunter_user'

/** 获取存储的 token */
export function getToken(): string | null {
  return Taro.getStorageSync(TOKEN_KEY) || null
}

/** 设置 token（持久化到本地存储） */
export function setToken(token: string): void {
  Taro.setStorageSync(TOKEN_KEY, token)
}

/** 清除 token */
export function clearToken(): void {
  Taro.removeStorageSync(TOKEN_KEY)
}

/** 获取存储的用户信息 */
export function getUser(): AuthUser | null {
  const user = Taro.getStorageSync(USER_KEY)
  return user || null
}

/** 设置用户信息（持久化到本地存储） */
export function setUser(user: AuthUser): void {
  Taro.setStorageSync(USER_KEY, user)
}

/** 清除用户信息 */
export function clearUser(): void {
  Taro.removeStorageSync(USER_KEY)
}

/** 是否已登录 */
export function isLoggedIn(): boolean {
  return !!getToken()
}

/** 退出登录 */
export function logout(): void {
  clearToken()
  clearUser()
  Taro.reLaunch({ url: '/pages/login/index' })
}

/** 自动登录恢复：检查本地是否有 token，有则恢复用户状态 */
export async function tryAutoLogin(): Promise<AuthUser | null> {
  const token = getToken()
  if (!token) return null
  const user = getUser()
  return user
}
