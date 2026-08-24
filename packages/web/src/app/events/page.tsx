'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEvents, signupEvent, cancelSignup, getMyEvents } from '@/services/events'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { format } from 'date-fns'
import { useTranslation } from '@/lib/i18n'
import {
  Calendar, MapPin, Users, Clock, Globe, Building2,
  ChevronLeft, ChevronRight, Search, Plus, Star,
  Loader2, X, CheckCircle, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

/* 活动状态标签 */
function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const config: Record<string, { variant: 'blue' | 'cyan' | 'purple' | 'default'; label: string }> = {
    pending: { variant: 'default', label: t('events.pending') },
    approved: { variant: 'blue', label: t('events.approved') },
    rejected: { variant: 'default', label: t('events.rejected') },
    ongoing: { variant: 'cyan', label: t('events.ongoing') },
    ended: { variant: 'default', label: t('events.ended') },
  }
  const c = config[status] || config.pending
  return <Badge variant={c.variant}>{c.label}</Badge>
}

/* 活动页 */
export default function EventsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const pageSize = 9

  /* 活动列表 */
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', page, keyword],
    queryFn: () => getEvents({ page, pageSize, keyword: keyword || undefined }),
    enabled: activeTab === 'all',
  })

  /* 我的活动 */
  const { data: myEventsData, isLoading: myLoading } = useQuery({
    queryKey: ['myEvents', page],
    queryFn: () => getMyEvents({ page, pageSize }),
    enabled: activeTab === 'my' && isAuthenticated,
  })

  /* 报名/取消报名（乐观更新：按钮即时切换 + 人数即时变化） */
  const signupMutation = useMutation({
    mutationFn: signupEvent,
    onMutate: async (eventId: string) => {
      const key = ['events', page, keyword]
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old
        return {
          ...old,
          items: (old.items || []).map((it: any) =>
            it.id === eventId
              ? { ...it, isSignedUp: true, currentParticipants: (it.currentParticipants ?? 0) + 1 }
              : it
          ),
        }
      })
      return { prev }
    },
    onError: (_e: string, _v: string, ctx: any) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['events', page, keyword], ctx.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['myEvents'] })
    },
  })
  const cancelMutation = useMutation({
    mutationFn: cancelSignup,
    onMutate: async (eventId: string) => {
      const key = ['events', page, keyword]
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old
        return {
          ...old,
          items: (old.items || []).map((it: any) =>
            it.id === eventId
              ? { ...it, isSignedUp: false, currentParticipants: Math.max(0, (it.currentParticipants ?? 0) - 1) }
              : it
          ),
        }
      })
      return { prev }
    },
    onError: (_e: string, _v: string, ctx: any) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['events', page, keyword], ctx.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['myEvents'] })
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setKeyword(searchInput.trim())
    setPage(1)
  }

  const currentData = activeTab === 'all' ? eventsData : myEventsData
  const currentLoading = activeTab === 'all' ? isLoading : myLoading
  const items = currentData?.items || []
  const totalPages = currentData ? Math.ceil(currentData.total / pageSize) : 1

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {/* 标题与操作 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-star-white">{t('events.title')}</h1>
            <p className="mt-1 text-sm text-star-dim">{t('events.subtitle')}</p>
          </div>
          {isAuthenticated && (
            <Link href="/events/new">
              <Button variant="primary">
                <Plus className="mr-2 h-4 w-4" />
                {t('events.createBtn')}
              </Button>
            </Link>
          )}
        </div>

        {/* 标签页 + 搜索 */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => { setActiveTab('all'); setPage(1) }}
              className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                activeTab === 'all'
                  ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                  : 'text-star-dim hover:text-star-white hover:bg-space-700'
              }`}
            >
              {t('events.allEvents')}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => { setActiveTab('my'); setPage(1) }}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  activeTab === 'my'
                    ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                    : 'text-star-dim hover:text-star-white hover:bg-space-700'
                }`}
              >
                {t('events.myEvents')}
              </button>
            )}
          </div>

          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-star-dim" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('events.searchPlaceholder')}
              className="w-56 rounded-lg border border-space-600 bg-space-800 py-1.5 pl-9 pr-3 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
            />
          </form>
        </div>

        {/* 活动卡片列表 */}
        <div className="mt-6">
          {currentLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} glowColor="blue" className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-full" />
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar className="mx-auto h-12 w-12 text-star-dim/40" />
              <p className="mt-4 text-star-dim">{t('events.noEvents')}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((event) => (
                <Card
                  key={event.id}
                  glowColor="blue"
                  className="group flex cursor-pointer flex-col transition-all hover:border-neon-blue/50 hover:shadow-lg hover:shadow-neon-blue/5"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  {/* 官方标记 + 状态 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {event.isOfficial && (
                        <Badge variant="purple">
                          <Star className="mr-1 h-3 w-3" />
                          {t('events.official')}
                        </Badge>
                      )}
                      <StatusBadge status={event.status} />
                    </div>
                    <span className="text-xs text-star-dim">
                      {format(new Date(event.createdAt), 'MM-dd')}
                    </span>
                  </div>

                  {/* 标题 */}
                  <h3 className="mt-3 text-base font-medium text-star-white group-hover:text-neon-blue transition-colors line-clamp-2">
                    {event.title}
                  </h3>

                  {/* 信息 */}
                  <div className="mt-3 space-y-2 text-sm text-star-dim">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-1">
                        {format(new Date(event.startTime), 'MM-dd HH:mm')} ~ {format(new Date(event.endTime), 'MM-dd HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.locationType === 'online' ? (
                        <Globe className="h-4 w-4 shrink-0" />
                      ) : (
                        <Building2 className="h-4 w-4 shrink-0" />
                      )}
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0" />
                      <span>{event.currentParticipants}/{event.maxParticipants}</span>
                    </div>
                  </div>

                  {/* 报名按钮 */}
                  <div className="mt-auto pt-4">
                    {event.status === 'ongoing' || event.status === 'approved' ? (
                      event.isSignedUp ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          disabled={cancelMutation.isPending}
                          onClick={(e) => { e.stopPropagation(); cancelMutation.mutate(event.id) }}
                        >
                          {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                          {t('events.signedUp')}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          disabled={(event.maxParticipants > 0 && event.currentParticipants >= event.maxParticipants) || signupMutation.isPending}
                          onClick={(e) => { e.stopPropagation(); signupMutation.mutate(event.id) }}
                        >
                          {signupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {event.maxParticipants > 0 && event.currentParticipants >= event.maxParticipants ? t('events.full') : t('events.signup')}
                        </Button>
                      )
                    ) : (
                      <Button variant="secondary" size="sm" className="w-full" disabled>
                        {event.status === 'ended' ? t('events.ended') : event.status === 'pending' ? t('events.pending') : t('events.cannotSignup')}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-space-600 bg-space-800 px-3 py-1.5 text-sm text-star-dim hover:text-star-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-star-dim">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-space-600 bg-space-800 px-3 py-1.5 text-sm text-star-dim hover:text-star-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
