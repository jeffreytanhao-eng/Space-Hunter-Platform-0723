import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { LocaleInitializer } from '@/components/locale-initializer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: '太空猎人 - 天文爱好者社区',
  description: '探索宇宙，分享星空 — 天文爱好者的深空社区',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="min-h-screen bg-space-900 font-sans">
        <Providers>
          <LocaleInitializer />
          {children}
        </Providers>
      </body>
    </html>
  )
}