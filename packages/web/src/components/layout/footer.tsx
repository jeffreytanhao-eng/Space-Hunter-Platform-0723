'use client'

import { useTranslation } from '@/lib/i18n'

/* 底部 */
export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-space-600 bg-space-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm text-star-dim">{t('footer.copyright')}</span>
          <div className="flex gap-4 text-sm text-star-dim">
            <a href="#" className="hover:text-star-white transition-colors">{t('footer.about')}</a>
            <a href="#" className="hover:text-star-white transition-colors">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-star-white transition-colors">{t('footer.help')}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}