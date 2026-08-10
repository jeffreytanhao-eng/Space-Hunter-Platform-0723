'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, X, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { getNotifications, getUnreadCount, markRead, markAllRead } from '@/services/notifications'
import { format } from 'date-fns'

/* 顶栏通知铃铛 */
export function NotificationBell() {
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  /* 未读数：进入时拉取 + 每 30s 轮询 */
  const { data: unread = 0 } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })

  /* 通知列表 */
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ page: 1, pageSize: 20 }),
    enabled: isAuthenticated && open,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notif-unread'] })
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  /* 单条已读 */
  const readMutation = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: refresh,
  })

  /* 全部已读 */
  const readAllMutation = useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: refresh,
  })

  /* 点击外部关闭 */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isAuthenticated) return null

  const items = notifData?.items || []

  return (
    <div className="relative" ref={wrapRef}>
      {/* 私信入口 */}
      <Link
        href="/messages"
        className="mr-1 inline-flex items-center justify-center rounded-lg p-1.5 text-star-dim hover:bg-space-700 hover:text-star-white transition-colors"
        title="私信"
      >
        <MessageSquare className="h-5 w-5" />
      </Link>

      {/* 铃铛 */}
      <button
        onClick={() => setOpen(!open)}
        className="relative inline-flex items-center justify-center rounded-lg p-1.5 text-star-dim hover:bg-space-700 hover:text-star-white transition-colors"
        title="通知"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* 通知下拉 */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 rounded-xl border-glow-blue bg-space-800 py-2 shadow-xl">
          <div className="flex items-center justify-between border-b border-space-600 px-4 pb-2">
            <span className="text-sm font-medium text-star-white">通知</span>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={() => readAllMutation.mutate()}
                  disabled={readAllMutation.isPending}
                  className="text-xs text-neon-cyan hover:underline disabled:opacity-50"
                >
                  {readAllMutation.isPending ? '处理中...' : '全部已读'}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-star-dim hover:text-star-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-star-dim">暂无通知</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && readMutation.mutate(n.id)}
                  className={`flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-space-700 ${n.isRead ? 'opacity-60' : ''}`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-medium text-star-white">{n.title}</span>
                    {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                  </div>
                  {n.content && <span className="line-clamp-2 text-xs text-star-dim">{n.content}</span>}
                  <span className="text-xs text-star-dim/60">{format(new Date(n.createdAt), 'MM-dd HH:mm')}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
