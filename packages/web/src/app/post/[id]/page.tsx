'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPost, toggleLike, deletePost } from '@/services/posts'
import { getComments, createComment, deleteComment } from '@/services/comments'
import { addFavorite, removeFavorite } from '@/services/favorites'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { UserProfileModal } from '@/components/ui/user-profile-modal'
import { format } from 'date-fns'
import {
  Heart, MessageCircle, Download, Trash2, Edit3,
  ChevronLeft, ChevronRight, X, Send, Eye, Telescope, Clock, Filter,
  Bookmark, MessageSquare
} from 'lucide-react'

/* 帖子详情页 */
export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const postId = params.id as string

  const [commentContent, setCommentContent] = useState('')
  const [commentPage, setCommentPage] = useState(1)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  /* 帖子详情 */
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId),
  })

  /* 评论列表 */
  const { data: commentsData } = useQuery({
    queryKey: ['comments', postId, commentPage],
    queryFn: () => getComments(postId, { page: commentPage, pageSize: 20 }),
  })

  /* 点赞（乐观更新，与画廊一致：红心即时变化） */
  const likeMutation = useMutation({
    mutationFn: () => toggleLike(postId),
    onMutate: async () => {
      const key = ['post', postId]
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old
        return {
          ...old,
          isLiked: !old.isLiked,
          likesCount: (old.likesCount ?? 0) + (old.isLiked ? -1 : 1),
        }
      })
      return { prev }
    },
    onError: (_e: string, _v: void, ctx: any) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['post', postId], ctx.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  /* 收藏（乐观更新：数字即时增加） */
  const favoriteMutation = useMutation({
    mutationFn: () => (post?.isFavorited ? removeFavorite('post', postId) : addFavorite('post', postId)),
    onMutate: async () => {
      const key = ['post', postId]
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old
        return {
          ...old,
          isFavorited: !old.isFavorited,
          favoriteCount: (old.favoriteCount ?? 0) + (old.isFavorited ? -1 : 1),
        }
      })
      return { prev }
    },
    onError: (_e: string, _v: void, ctx: any) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['post', postId], ctx.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  /* 删除帖子 */
  const deletePostMutation = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      router.replace('/')
    },
  })

  /* 发评论 */
  const commentMutation = useMutation({
    mutationFn: () => createComment(postId, commentContent),
    onSuccess: () => {
      setCommentContent('')
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  /* 删除评论 */
  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  const isAuthor = user && post && user.id === post.authorId
  const commentTotalPages = commentsData ? Math.ceil(commentsData.total / 20) : 1

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-4xl px-4 py-8">
          <Skeleton className="mb-4 h-8 w-3/4" />
          <Skeleton className="mb-8 h-4 w-1/3" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-4xl px-4 py-20 text-center">
          <p className="text-star-dim">帖子不存在或已被删除</p>
          <Button variant="secondary" className="mt-4" onClick={() => router.replace('/')}>
            返回首页
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm text-star-dim hover:text-star-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          返回
        </button>

        {/* 帖子内容 */}
        <Card glowColor="blue" className="mb-6">
          {/* 标题 */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-star-white">{post.title}</h1>
            {/* 作者操作按钮 */}
            {isAuthor && (
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/post/${postId}/edit`)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('确定删除这篇帖子吗？')) {
                      deletePostMutation.mutate()
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            )}
          </div>

          {/* 作者信息 */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setProfileUserId(post.authorId)}
              className="flex items-center gap-3 group"
            >
              <Avatar src={post.authorAvatar} alt={post.authorNickname} size="md" />
              <div className="text-left">
                <p className="text-sm font-medium text-star-white group-hover:text-neon-blue transition-colors">
                  {post.authorNickname}
                </p>
                <p className="text-xs text-star-dim">
                  {format(new Date(post.createdAt), 'yyyy-MM-dd HH:mm')}
                  {post.sectionName && ` · ${post.sectionName}`}
                </p>
              </div>
            </button>
          </div>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(post.tags || []).map((t) => (
                <Badge key={t} variant="cyan">{t}</Badge>
              ))}
            </div>
          )}

          {/* 正文 */}
          <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-star-white/90">
            {post.content}
          </div>

          {/* 图片画廊 */}
          {post.images && post.images.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(post.images || []).map((img, index) => (
                <div
                  key={img.id}
                  className="group relative cursor-pointer overflow-hidden rounded-lg border border-space-600"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={img.thumbnailUrl || img.url}
                    alt=""
                    className="h-40 w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {/* FITS 标记 */}
                  {img.isFits && (
                    <Badge variant="purple" className="absolute left-2 top-2">FITS</Badge>
                  )}
                  {/* 处理中状态 */}
                  {img.processingStatus && img.processingStatus !== 'done' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-space-900/70">
                      <span className="text-xs text-neon-cyan animate-pulse">
                        {img.processingStatus === 'pending' ? '等待处理' : '处理中...'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* FITS 元数据卡片 */}
          {post.fitsMeta && (
            <Card glowColor="purple" className="mt-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-neon-purple">
                <Telescope className="h-4 w-4" />
                FITS 元数据
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {post.fitsMeta.object && (
                  <div>
                    <span className="text-star-dim">观测目标</span>
                    <p className="text-star-white">{post.fitsMeta.object}</p>
                  </div>
                )}
                {post.fitsMeta.telescope && (
                  <div>
                    <span className="text-star-dim">望远镜</span>
                    <p className="text-star-white">{post.fitsMeta.telescope}</p>
                  </div>
                )}
                {post.fitsMeta.exposure && (
                  <div>
                    <span className="flex items-center gap-1 text-star-dim">
                      <Clock className="h-3 w-3" /> 曝光时间
                    </span>
                    <p className="text-star-white">{post.fitsMeta.exposure}</p>
                  </div>
                )}
                {post.fitsMeta.filter && (
                  <div>
                    <span className="flex items-center gap-1 text-star-dim">
                      <Filter className="h-3 w-3" /> 滤镜
                    </span>
                    <p className="text-star-white">{post.fitsMeta.filter}</p>
                  </div>
                )}
                {post.fitsMeta.dateObs && (
                  <div>
                    <span className="text-star-dim">观测日期</span>
                    <p className="text-star-white">{post.fitsMeta.dateObs}</p>
                  </div>
                )}
                {post.fitsMeta.resolution && (
                  <div>
                    <span className="text-star-dim">分辨率</span>
                    <p className="text-star-white">{post.fitsMeta.resolution}</p>
                  </div>
                )}
              </div>
              {/* 下载按钮 */}
              {post.fitsMeta.downloadUrl && (
                <a
                  href={post.fitsMeta.downloadUrl}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-neon-purple/15 px-4 py-2 text-sm text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  下载 FITS 原始文件
                  {post.fitsMeta.fileSize && (
                    <span className="text-star-dim">
                      ({(post.fitsMeta.fileSize / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  )}
                </a>
              )}
            </Card>
          )}

          {/* 点赞按钮 */}
          <div className="mt-6 flex items-center gap-4 border-t border-space-600 pt-4">
            <button
              onClick={() => isAuthenticated && likeMutation.mutate()}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
                post.isLiked
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-space-700 text-star-dim hover:text-star-white border border-space-600'
              } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
              {post.likesCount}
            </button>
            {/* 收藏 */}
            <button
              onClick={() => isAuthenticated && favoriteMutation.mutate()}
              disabled={favoriteMutation.isPending}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
                post.isFavorited
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                  : 'bg-space-700 text-star-dim hover:text-star-white border border-space-600'
              } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Bookmark className={`h-4 w-4 ${post.isFavorited ? 'fill-current' : ''}`} />
              {post.favoriteCount ?? 0}
            </button>
            {/* 私信作者 */}
            {isAuthenticated && user && user.id !== post.authorId && (
              <button
                onClick={() => router.push(`/messages?peerId=${post.authorId}`)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors bg-space-700 text-star-dim hover:text-star-white border border-space-600"
              >
                <MessageSquare className="h-4 w-4" />
                私信
              </button>
            )}
            <span className="flex items-center gap-2 text-sm text-star-dim">
              <MessageCircle className="h-4 w-4" />
              {post.commentsCount} 条评论
            </span>
          </div>
        </Card>

        {/* 评论区 */}
        <Card glowColor="cyan" className="mb-6">
          <h2 className="mb-4 text-lg font-medium text-star-white">评论</h2>

          {/* 发评论 */}
          {isAuthenticated ? (
            <div className="mb-6 flex gap-3">
              <Avatar src={user?.avatar} alt={user?.nickname || ''} size="sm" />
              <div className="flex-1">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="写下你的评论..."
                  rows={3}
                  className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30 resize-none transition-colors"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!commentContent.trim() || commentMutation.isPending}
                    onClick={() => commentMutation.mutate()}
                  >
                    <Send className="mr-1 h-3 w-3" />
                    {commentMutation.isPending ? '发送中...' : '发送'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-lg bg-space-700 px-4 py-3 text-center text-sm text-star-dim">
              请先 <a href="/login" className="text-neon-blue hover:underline">登录</a> 后发表评论
            </div>
          )}

          {/* 评论列表 */}
          <div className="space-y-4">
            {(commentsData?.items || []).map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar src={comment.authorAvatar} alt={comment.authorNickname} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-star-white">{comment.authorNickname}</span>
                      <span className="ml-2 text-xs text-star-dim">
                        {format(new Date(comment.createdAt), 'MM-dd HH:mm')}
                      </span>
                    </div>
                    {/* 删除评论（仅作者可见） */}
                    {user && user.id === comment.authorId && (
                      <button
                        onClick={() => {
                          if (confirm('确定删除这条评论吗？')) {
                            deleteCommentMutation.mutate(comment.id)
                          }
                        }}
                        className="text-star-dim hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-star-white/80">{comment.content}</p>
                </div>
              </div>
            ))}
            {(!commentsData || !commentsData.items || commentsData.items.length === 0) && (
              <p className="py-4 text-center text-sm text-star-dim">暂无评论，快来发表第一条吧！</p>
            )}
          </div>

          {/* 评论分页 */}
          {commentTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setCommentPage(Math.max(1, commentPage - 1))}
                disabled={commentPage <= 1}
                className="rounded-lg border border-space-600 bg-space-700 px-2 py-1 text-xs text-star-dim hover:text-star-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="text-xs text-star-dim">{commentPage} / {commentTotalPages}</span>
              <button
                onClick={() => setCommentPage(Math.min(commentTotalPages, commentPage + 1))}
                disabled={commentPage >= commentTotalPages}
                className="rounded-lg border border-space-600 bg-space-700 px-2 py-1 text-xs text-star-dim hover:text-star-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </Card>
      </main>

      {/* 图片大图查看 */}
      {lightboxIndex !== null && post.images && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-space-900/90 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute right-4 top-4 text-star-dim hover:text-star-white"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={post.images[lightboxIndex]?.url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* 用户资料弹窗 */}
      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          nickname={post.authorNickname}
          avatar={post.authorAvatar}
          onClose={() => setProfileUserId(null)}
        />
      )}

      <Footer />
    </div>
  )
}
