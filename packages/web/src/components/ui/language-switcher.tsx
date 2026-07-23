'use client'

import { useLocaleStore } from '@/stores/locale-store'
import { useTranslation } from '@/lib/i18n'
import { Globe } from 'lucide-react'

/* 语言切换按钮 */
export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore()
  const { t } = useTranslation()

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh')
  }

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-star-dim hover:text-star-white hover:bg-space-700 transition-colors border border-space-600/50"
      title={t('language.label')}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{t('language.switchTo')}</span>
    </button>
  )
}
