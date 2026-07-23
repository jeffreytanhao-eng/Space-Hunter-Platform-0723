'use client'

import { useEffect } from 'react'
import { useLocaleStore } from '@/stores/locale-store'

/* 初始化语言偏好（从 localStorage 读取） */
export function LocaleInitializer() {
  const setLocale = useLocaleStore((s) => s.setLocale)
  const setIsLoaded = useLocaleStore((s) => s.setIsLoaded)

  useEffect(() => {
    const saved = localStorage.getItem('locale')
    if (saved === 'en' || saved === 'zh') {
      setLocale(saved)
    }
    setIsLoaded(true)
  }, [setLocale, setIsLoaded])

  return null
}