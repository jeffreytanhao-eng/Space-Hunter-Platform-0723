'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* 侧边栏导航项 */
const navItems = [
  { href: '/admin', label: '仪表盘' },
  { href: '/admin/posts', label: '帖子审核' },
  { href: '/admin/gallery', label: '画廊审核' },
  { href: '/admin/events', label: '活动审核' },
  { href: '/admin/sections', label: '板块管理' },
  { href: '/admin/users', label: '用户管理' },
  { href: '/admin/points', label: '积分管理' },
]

/* Admin 独立布局：与用户端布局完全隔离 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-space-900">
      <div className="border-b border-space-600 px-6 py-3">
        <h2 className="text-lg font-semibold text-neon-blue">太空猎人 · 管理后台</h2>
      </div>
      <div className="flex">
        <aside className="w-52 shrink-0 border-r border-space-600 p-4">
          <nav className="space-y-1 text-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-neon-blue/10 text-neon-blue'
                      : 'text-star-dim hover:bg-space-700 hover:text-star-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
