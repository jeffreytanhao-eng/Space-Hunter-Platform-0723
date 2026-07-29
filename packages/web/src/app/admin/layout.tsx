'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore } from '@/stores/auth-store'
import { Loader2 } from 'lucide-react'
import {
  LayoutDashboard, Image, Calendar, Coins,
  FileText, Settings, Users, Megaphone,
} from 'lucide-react'

/* 管理后台布局 */
const navItems = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard, exact: true },
  { href: '/admin/posts', label: '帖子管理', icon: FileText },
  { href: '/admin/gallery', label: '画廊管理', icon: Image },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/sections', label: '板块管理', icon: Settings },
  { href: '/admin/events', label: '活动管理', icon: Calendar },
  { href: '/admin/points', label: '积分管理', icon: Coins },
  { href: '/admin/ads', label: '广告管理', icon: Megaphone },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  /* 等待 hydrate 完成 */
  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
      </div>
    )
  }

  /* 未登录或非管理员 */
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex-1 px-4 py-20 text-center">
          <p className="text-star-dim">需要管理员权限才能访问此页面</p>
          <Link href="/login" className="mt-4 inline-block rounded-lg bg-neon-blue/10 px-4 py-2 text-sm text-neon-blue border border-neon-blue/30">
            去登录
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-4">
        {/* 侧边导航 */}
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-18 space-y-1">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30'
                      : 'text-star-dim hover:bg-space-700 hover:text-star-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="min-w-0 flex-1 md:pl-6">
          {children}
        </main>
      </div>
    </div>
  )
}
