import { create } from 'zustand'
import type { User } from '@/types'
import * as authService from '@/services/auth'
import { setToken, removeToken } from '@/lib/auth'

/* 认证状态 */
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  /* Actions */
  login: (phone: string, code: string) => Promise<void>
  register: (phone: string, code: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (phone, code) => {
    const res = await authService.login(phone, code)
    setToken(res.token)
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', res.refreshToken)
      localStorage.setItem('user_data', JSON.stringify(res.user))
    }
    set({
      user: res.user,
      token: res.token,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  register: async (phone, code) => {
    const res = await authService.register(phone, code)
    setToken(res.token)
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', res.refreshToken)
      localStorage.setItem('user_data', JSON.stringify(res.user))
    }
    set({
      user: res.user,
      token: res.token,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  logout: () => {
    authService.logout()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data')
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(user))
    }
    set({ user })
  },

  /* 从 localStorage 恢复登录状态 */
  hydrate: () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false })
      return
    }
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    if (token && userData) {
      try {
        const user = JSON.parse(userData) as User
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch {
        removeToken()
        localStorage.removeItem('user_data')
        set({ isLoading: false })
      }
    } else {
      set({ isLoading: false })
    }
  },
}))
