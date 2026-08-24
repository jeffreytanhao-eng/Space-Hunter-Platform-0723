﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getPosts } from '@/services/posts'
import { getFollowFeed } from '@/services/follows'
import { getSections } from '@/services/sections'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Starfield } from '@/components/effects/starfield'
import { useAuthStore } from '@/stores/auth-store'
import { UserProfileModal } from '@/components/ui/user-profile-modal'
import { format } from 'date-fns'
import { Heart, MessageCircle, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

/* 论坛首页内容 */
function HomeContent() {
  const searchParams = useSearchParams()
  const keyword = searchParams.get('keyword') || undefined
  const sectionId = searchParams.get('sectionId') || undefined
  const tag = searchParams.get('tag') || undefined

  const [page, setPage] = useState(1)
  const [searchValue, setSearchValue] = useState(keyword || '')
  const pageSize = 10

  /* 关注动态流视图 */
  const [view, setView] = useState<'all' | 'feed'>('all')
  const [feedPage, setFeedPage] = useState(1)
  const feedPageSize = 10
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  const { t } = useTranslation()

  const { isAuthenticated } = useAuthStore()

  /* 板块名翻译：查 i18n 词典，查不到则 fallback 到原始名称 */
  const sectionName = (name: string) => {
    const key = `sections.${name}`
    const translated = t(key)
    return translated === key ? name : translated
  }

  /* 帖子标签翻译：查 i18n 词典，查不到则 fallback 到原始标签名 */
  const postTagName = (tag: string) => {
    const key = `postTags.${tag}`
    const translated = t(key)
    return translated === key ? tag : translated
  }

  /* 板块列表 */
  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: getSections,
  })

  /* 帖子列表 */
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', page, sectionId, keyword, tag],
    queryFn: () =>
      getPosts({
        page,
        pageSize,
        sectionId: sectionId || undefined,
        keyword,
        tag,
      }),
  })

  /* 关注动态流 */
  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['followFeed', feedPage],
    queryFn: () => getFollowFeed({ page: feedPage, pageSize: feedPageSize }),
    enabled: view === 'feed',
  })

  /* 切换板块时重置页码 */
  useEffect(() => {
    setPage(1)
  }, [sectionId])

  const totalPages = postsData ? Math.ceil(postsData.total / pageSize) : 1
  const feedTotalPages = feedData ? Math.ceil(feedData.total / feedPageSize) : 1

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero 区域 */}
      <div className="relative overflow-hidden">
        <Starfield />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-5xl font-bold text-neon-blue text-glow-blue md:text-6xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-3 text-lg text-star-dim">{t('home.heroSubtitle')}</p>
          {/* 搜索框 */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (searchValue.trim()) {
                window.location.href = `/?keyword=${encodeURIComponent(searchValue.trim())}`
              }
            }}
            className="mx-auto mt-8 max-w-lg"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-star-dim" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                className="w-full rounded-xl border border-space-600 bg-space-800/80 py-3 pl-12 pr-4 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 backdrop-blur-sm transition-colors"
              />
            </div>
          </form>
        </div>
      </div>

      {/* 板块导航标签 */}
      <div className="border-b border-space-600 bg-space-800/50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {/* 关注动态流入口（仅登录可见） */}
            {isAuthenticated && (
              <button
                onClick={() => {
                  setView('feed')
                  setFeedPage(1)
                }}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm transition-colors ${
                  view === 'feed'
                    ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                    : 'text-star-dim hover:text-star-white hover:bg-space-700'
                }`}
              >
                关注
              </button>
            )}
            <Link
              href="/"
              className={`shrink-0 rounded-lg px-4 py-2 text-sm transition-colors ${
                !sectionId
                  ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                  : 'text-star-dim hover:text-star-white hover:bg-space-700'
              }`}
            >
              {t('home.allSections')}
            </Link>
            {sections?.map((section) => (
              <Link
                key={section.id}
                href={`/?sectionId=${section.id}`}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm transition-colors ${
                  sectionId === String(section.id)
                    ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                    : 'text-star-dim hover:text-star-white hover:bg-space-700'
                }`}
              >
                {sectionName(section.name)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6">
        {/* 帖子列表 */}
        <main className="flex-1 space-y-4">
          {view === 'feed' ? (
            <>
              {feedLoading ? (
                /* 骨架屏 */
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} glowColor="blue" className="space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </Card>
                ))
              ) : feedData?.items?.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-star-dim">还没有关注动态，去关注喜欢的创作者吧</p>
                </div>
              ) : (
                feedData?.items?.map((item) => (
                  <Link key={`${item.type}-${item.id}`} href={item.type === 'post' ? `/post/${item.id}` : '/gallery'}>
                    <Card glowColor="blue" className="group cursor-pointer transition-all hover:border-neon-blue/50 hover:shadow-lg hover:shadow-neon-blue/5">
                      <div className="flex gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <Badge variant={item.type === 'post' ? 'blue' : 'purple'} className="shrink-0">
                              {item.type === 'post' ? '帖子' : '画廊'}
                            </Badge>
                            <h3 className="text-base font-medium text-star-white group-hover:text-neon-blue transition-colors line-clamp-1">
                              {item.title}
                            </h3>
                          </div>
                          {/* 作者信息 */}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProfileUserId(item.authorId) }}
                              className="group flex items-center gap-2"
                            >
                              <Avatar src={item.authorAvatar} alt={item.authorNickname} size="sm" />
                              <span className="text-sm text-star-dim group-hover:text-neon-blue transition-colors">
                                {item.authorNickname}
                              </span>
                            </button>
                            <span className="text-xs text-star-dim/60">
                              {format(new Date(item.createdAt), 'MM-dd HH:mm')}
                            </span>
                          </div>
                          {/* 内容摘要 */}
                          {item.content && (
                            <p className="mt-2 line-clamp-2 text-sm text-star-dim">{item.content}</p>
                          )}
                          {/* 互动数据 */}
                          <div className="mt-3 flex items-center gap-4 text-sm text-star-dim">
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {item.likesCount}
                            </span>
                            {item.commentsCount !== undefined && (
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                {item.commentsCount}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* 缩略图 */}
                        {item.thumbnailUrl && (
                          <div className="hidden shrink-0 sm:block">
                            <div className="h-24 w-24 overflow-hidden rounded-lg">
                              <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))
              )}

              {/* 关注动态分页 */}
              {feedTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => setFeedPage(Math.max(1, feedPage - 1))}
                    disabled={feedPage <= 1}
                    className="rounded-lg border border-space-600 bg-space-800 px-3 py-1.5 text-sm text-star-dim hover:text-star-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-star-dim">
                    {feedPage} / {feedTotalPages}
                  </span>
                  <button
                    onClick={() => setFeedPage(Math.min(feedTotalPages, feedPage + 1))}
                    disabled={feedPage >= feedTotalPages}
                    className="rounded-lg border border-space-600 bg-space-800 px-3 py-1.5 text-sm text-star-dim hover:text-star-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {isLoading ? (
            /* 骨架屏 */
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} glowColor="blue" className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </Card>
            ))
          ) : postsData?.items?.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-star-dim">{t('home.noPosts')}</p>
            </div>
          ) : (
            postsData?.items?.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <Card glowColor="blue" className="group cursor-pointer transition-all hover:border-neon-blue/50 hover:shadow-lg hover:shadow-neon-blue/5">
                  <div className="flex gap-4">
                    {/* 帖子内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="text-base font-medium text-star-white group-hover:text-neon-blue transition-colors line-clamp-1">
                          {post.title}
                        </h3>
                        {/* FITS 角标 */}
                        {post.images?.some((img) => img.isFits) && (
                          <Badge variant="purple" className="shrink-0">FITS</Badge>
                        )}
                      </div>
                      {/* 作者信息 */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProfileUserId(post.authorId) }}
                          className="group flex items-center gap-2"
                        >
                          <Avatar src={post.authorAvatar} alt={post.authorNickname} size="sm" />
                          <span className="text-sm text-star-dim group-hover:text-neon-blue transition-colors">
                            {post.authorNickname}
                          </span>
                        </button>
                        <span className="text-xs text-star-dim/60">
                          {format(new Date(post.createdAt), 'MM-dd HH:mm')}
                        </span>
                      </div>
                      {/* 标签 */}
                      {post.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tg) => (
                            <Link key={tg} href={`/?tag=${encodeURIComponent(tg)}`}>
                              <Badge variant="cyan" className="hover:bg-neon-cyan/25 transition-colors cursor-pointer">{postTagName(tg)}</Badge>
                            </Link>
                          ))}
                        </div>
                      )}
                      {/* 互动数据 */}
                      <div className="mt-3 flex items-center gap-4 text-sm text-star-dim">
                        <span className="flex items-center gap-1">
                          <Heart className={`h-4 w-4 ${post.isLiked ? 'text-red-400' : ''}`} />
                          {post.likesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {post.commentsCount}
                        </span>
                      </div>
                    </div>
                    {/* 缩略图 */}
                    {post.images?.[0]?.thumbnailUrl && (
                      <div className="hidden shrink-0 sm:block">
                        <div className="h-24 w-24 overflow-hidden rounded-lg">
                          <img
                            src={post.images[0].thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-space-600 bg-space-800 px-3 py-1.5 text-sm text-star-dim hover:text-star-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-star-dim">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-space-600 bg-space-800 px-3 py-1.5 text-sm text-star-dim hover:text-star-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
            </>
          )}
        </main>

        {/* 右侧栏 */}
        <Sidebar />
      </div>

      {/* 浮动发帖按钮 */}
      {isAuthenticated && (
        <Link
          href="/post/new"
          className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-neon-blue text-space-900 shadow-lg shadow-neon-blue/30 hover:bg-neon-blue/90 transition-all hover:scale-105"
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}

      {/* 用户资料弹窗 */}
      {profileUserId && (
        <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}

      <Footer />
    </div>
  )
}

/* 论坛首页（Suspense 包裹） */
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}