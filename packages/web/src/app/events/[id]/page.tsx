'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEvent, signupEvent, cancelSignup } from '@/services/events'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { UserProfileModal } from '@/components/ui/user-profile-modal'
import { useAuthStore } from '@/stores/auth-store'
import { format } from 'date-fns'
import { useTranslation } from '@/lib/i18n'
import {
  Calendar, MapPin, Users, Clock, Globe, Building2,
  ChevronLeft, Loader2, CheckCircle, Star, UserPlus
} from 'lucide-react'

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

/* 活动详情页 */
export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const eventId = params.id as string
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEvent(eventId),
  })

  /* 报名 / 取消报名（乐观更新 + 反馈） */
  const signupMutation = useMutation({
    mutationFn: () => signupEvent(eventId),
    onMutate: async () => {
      const key = ['event', eventId]
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old
        return {
          ...old,
          isSignedUp: true,
          currentParticipants: (old.currentParticipants ?? 0) + 1,
        }
      })
      return { prev }
    },
    onError: (_e, _v, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['event', eventId], ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
  })
  const cancelMutation = useMutation({
    mutationFn: () => cancelSignup(eventId),
    onMutate: async () => {
      const key = ['event', eventId]
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old
        return {
          ...old,
          isSignedUp: false,
          currentParticipants: Math.max(0, (old.currentParticipants ?? 0) - 1),
        }
      })
      return { prev }
    },
    onError: (_e, _v, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['event', eventId], ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-3xl px-4 py-8">
          <Skeleton className="mb-4 h-8 w-2/3" />
          <Skeleton className="mb-8 h-4 w-1/3" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
          <p className="text-star-dim">活动不存在或已被删除</p>
          <Button variant="secondary" className="mt-4" onClick={() => router.replace('/events')}>
            返回活动列表
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  const isFull = event.maxParticipants > 0 && event.currentParticipants >= event.maxParticipants
  const canSignup = event.status === 'approved' || event.status === 'ongoing'

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {/* 返回 */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm text-star-dim hover:text-star-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          返回
        </button>

        <Card glowColor="blue" className="mb-6">
          {/* 状态标记 */}
          <div className="flex items-center gap-2">
            {event.isOfficial && (
              <Badge variant="purple">
                <Star className="mr-1 h-3 w-3" />
                {t('events.official')}
              </Badge>
            )}
            <StatusBadge status={event.status} />
          </div>

          <h1 className="mt-3 text-2xl font-bold text-star-white">{event.title}</h1>

          {/* 组织者 */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setProfileUserId(event.authorId)}
              className="group flex items-center gap-3"
            >
              <Avatar src={undefined} alt={event.authorNickname} size="sm" />
              <span className="text-sm text-star-dim group-hover:text-neon-blue transition-colors">
                {event.authorNickname}
              </span>
            </button>
            <span className="text-xs text-star-dim/60">
              {format(new Date(event.createdAt), 'yyyy-MM-dd')}
            </span>
          </div>

          {/* 活动信息 */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-lg bg-space-700 px-3 py-2.5 text-sm text-star-white">
              <Clock className="h-4 w-4 shrink-0 text-neon-blue" />
              {format(new Date(event.startTime), 'yyyy-MM-dd HH:mm')}
              {event.endTime ? ` ~ ${format(new Date(event.endTime), 'MM-dd HH:mm')}` : ''}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-space-700 px-3 py-2.5 text-sm text-star-white">
              {event.locationType === 'online' ? (
                <Globe className="h-4 w-4 shrink-0 text-neon-blue" />
              ) : (
                <Building2 className="h-4 w-4 shrink-0 text-neon-blue" />
              )}
              {event.locationType === 'online' ? '线上活动' : event.location || '线下活动'}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-space-700 px-3 py-2.5 text-sm text-star-white sm:col-span-2">
              <Users className="h-4 w-4 shrink-0 text-neon-blue" />
              已报名 {event.currentParticipants} / {event.maxParticipants} 人
              {event.maxParticipants > 0 && (
                <span className="text-star-dim">
                  （剩余 {Math.max(0, event.maxParticipants - event.currentParticipants)} 个名额）
                </span>
              )}
            </div>
          </div>

          {/* 详细描述 */}
          {event.description && (
            <div className="mt-6">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-neon-blue">
                <Calendar className="h-4 w-4" />
                活动详情
              </h2>
              <div className="whitespace-pre-wrap rounded-lg border border-space-600 bg-space-700/40 px-4 py-3 text-sm leading-relaxed text-star-white/90">
                {event.description}
              </div>
            </div>
          )}

          {/* 报名按钮 */}
          <div className="mt-6 border-t border-space-600 pt-4">
            {canSignup ? (
              event.isSignedUp ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  {t('events.signedUp')}（点击取消报名）
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={isFull || signupMutation.isPending}
                  onClick={() => signupMutation.mutate()}
                >
                  {signupMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {isFull ? t('events.full') : t('events.signup')}
                </Button>
              )
            ) : (
              <Button variant="secondary" className="w-full" disabled>
                {event.status === 'ended'
                  ? t('events.ended')
                  : event.status === 'pending'
                  ? t('events.pending')
                  : t('events.cannotSignup')}
              </Button>
            )}
            {!isAuthenticated && canSignup && (
              <p className="mt-2 text-center text-xs text-star-dim">
                请先 <a href="/login" className="text-neon-blue hover:underline">登录</a> 后报名参加活动
              </p>
            )}
          </div>
        </Card>
      </main>

      {/* 组织者用户弹窗 */}
      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          nickname={event.authorNickname}
          onClose={() => setProfileUserId(null)}
        />
      )}

      <Footer />
    </div>
  )
}
