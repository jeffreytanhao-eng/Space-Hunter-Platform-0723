'use client'

import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Users, FileText, Image, MessageCircle, Loader2 } from 'lucide-react'

/* 统计数据卡片 */
function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  color: string
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-star-dim">{label}</p>
        <p className="text-2xl font-bold text-star-white">{value}</p>
      </div>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [postsRes, galleryRes] = await Promise.all([
        apiClient.get('/posts', { params: { pageSize: 1 } }).then(r => r.data).catch(() => ({ total: 0 })),
        apiClient.get('/gallery', { params: { pageSize: 1 } }).then(r => r.data).catch(() => ({ total: 0 })),
      ])
      return {
        posts: postsRes?.total ?? 0,
        users: '-',
        gallery: galleryRes?.total ?? 0,
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-star-white">仪表盘</h1>
      <p className="mt-1 text-sm text-star-dim">太空猎人社区管理后台</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={FileText} label="帖子总数" value={stats?.posts ?? '-'} color="bg-neon-blue/10 text-neon-blue" />
        <StatCard icon={Users} label="注册用户" value={stats?.users ?? '-'} color="bg-neon-cyan/10 text-neon-cyan" />
        <StatCard icon={Image} label="画廊作品" value={stats?.gallery ?? '-'} color="bg-neon-purple/10 text-neon-purple" />
      </div>

      <Card className="mt-6">
        <h3 className="text-base font-medium text-star-white">快捷入口</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/admin/ads" className="rounded-lg bg-space-700 px-4 py-2 text-sm text-star-white hover:bg-space-600 transition-colors">广告管理</a>
          <a href="/admin/posts" className="rounded-lg bg-space-700 px-4 py-2 text-sm text-star-white hover:bg-space-600 transition-colors">帖子管理</a>
          <a href="/admin/users" className="rounded-lg bg-space-700 px-4 py-2 text-sm text-star-white hover:bg-space-600 transition-colors">用户管理</a>
          <a href="/admin/gallery" className="rounded-lg bg-space-700 px-4 py-2 text-sm text-star-white hover:bg-space-600 transition-colors">画廊管理</a>
        </div>
      </Card>
    </div>
  )
}
