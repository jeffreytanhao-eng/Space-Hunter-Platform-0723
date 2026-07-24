﻿﻿﻿import { create } from 'zustand'

export type Locale = 'zh' | 'en'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
  isLoaded: boolean
  setIsLoaded: (loaded: boolean) => void
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'zh',
  isLoaded: false,
  setLocale: (locale: Locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale)
      document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    }
    set({ locale })
  },
  setIsLoaded: (loaded: boolean) => set({ isLoaded: loaded }),
}))
