'use client'

import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, MessageSquare, UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { getUser } from '@/services/users'
import { getFollowStatus, followUser, unfollowUser } from '@/services/follows'
import { format } from 'date-fns'

interface UserProfileModalProps {
  userId: string
  nickname?: string
  avatar?: string
  onClose: () => void
}

/** 用户资料弹窗：展示公开资料 + 关注/取关 + 发私信 */
export function UserProfileModal({ userId, nickname, avatar, onClose }: UserProfileModalProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()

  const isSelf = user?.id === userId

  /* 公开资料 */
  const { data: profile } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
    enabled: !!userId,
  })

  /* 关注状态（需登录且非本人） */
  const { data: followStatus } = useQuery({
    queryKey: ['followStatus', userId],
    queryFn: () => getFollowStatus(userId),
    enabled: !!userId && isAuthenticated && !isSelf,
  })

  /* 关注/取关（乐观更新） */
  const followMutation = useMutation({
    mutationFn: () => (followStatus?.isFollowing ? unfollowUser(userId) : followUser(userId)),
    onMutate: async () => {
      const key = ['followStatus', userId]
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old
        return {
          ...old,
          isFollowing: !old.isFollowing,
          followersCount: old.isFollowing
            ? Math.max(0, (old.followersCount ?? 0) - 1)
            : (old.followersCount ?? 0) + 1,
        }
      })
      return { prev }
    },
    onError: (_e, _v, ctx: any) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['followStatus', userId], ctx.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus', userId] })
    },
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-space-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-space-600 bg-space-800 p-6 shadow-xl shadow-space-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部：头像 + 昵称 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={profile?.avatar || avatar} alt={profile?.nickname || nickname || ''} size="lg" />
            <div>
              <p className="text-base font-medium text-star-white">{profile?.nickname || nickname}</p>
              {profile?.createdAt && (
                <p className="text-xs text-star-dim">加入于 {format(new Date(profile.createdAt), 'yyyy-MM')}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-star-dim hover:text-star-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 简介 */}
        {profile?.bio && <p className="mt-4 text-sm leading-relaxed text-star-white/80">{profile.bio}</p>}

        {/* 兴趣标签 */}
        {profile?.interests && profile.interests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.interests.map((i) => (
              <span key={i} className="rounded-full bg-space-700 px-2.5 py-0.5 text-xs text-neon-cyan">
                {i}
              </span>
            ))}
          </div>
        )}

        {/* 设备 */}
        {profile?.equipment && <p className="mt-3 text-xs text-star-dim">设备：{profile.equipment}</p>}

        {/* 关注统计 */}
        <div className="mt-4 flex gap-6 border-t border-space-600 pt-4">
          <div>
            <p className="text-lg font-semibold text-star-white">{followStatus?.followersCount ?? 0}</p>
            <p className="text-xs text-star-dim">粉丝</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-star-white">{followStatus?.followingCount ?? 0}</p>
            <p className="text-xs text-star-dim">关注</p>
          </div>
        </div>

        {/* 操作按钮 */}
        {!isSelf && (
          <div className="mt-5 flex gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  variant={followStatus?.isFollowing ? 'secondary' : 'primary'}
                  size="sm"
                  className="flex-1"
                  disabled={followMutation.isPending}
                  onClick={() => followMutation.mutate()}
                >
                  {followMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : followStatus?.isFollowing ? (
                    <UserCheck className="mr-1.5 h-4 w-4" />
                  ) : (
                    <UserPlus className="mr-1.5 h-4 w-4" />
                  )}
                  {followStatus?.isFollowing ? '已关注' : '关注'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onClose()
                    router.push(`/messages?peerId=${userId}`)
                  }}
                >
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  发私信
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" className="w-full" onClick={() => router.push('/login')}>
                登录后关注 / 发私信
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
