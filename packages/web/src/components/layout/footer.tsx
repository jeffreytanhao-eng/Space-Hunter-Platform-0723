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
            <a href="/about" className="hover:text-star-white transition-colors">{t('footer.about')}</a>
            <a href="/privacy" className="hover:text-star-white transition-colors">{t('footer.privacy')}</a>
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center justify-center gap-2 border-t border-space-600 pt-4 text-xs text-star-dim sm:flex-row sm:gap-4">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-star-white transition-colors"
          >
            京ICP备2026039863号-2
          </a>
          <a
            href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010502062256"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-star-white transition-colors"
          >
            <img
              src="/备案图标.png"
              alt="公安备案"
              className="h-4 w-4 flex-none"
              width="16"
              height="16"
            />
            京公网安备11010502062256号
          </a>
        </div>
      </div>
    </footer>
  )
}