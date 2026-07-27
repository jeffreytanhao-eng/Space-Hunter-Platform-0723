﻿﻿﻿﻿﻿﻿'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getPosts } from '@/services/posts'
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
  const [activeSection, setActiveSection] = useState(sectionId || '')
  const [searchValue, setSearchValue] = useState(keyword || '')
  const pageSize = 10

  const { t } = useTranslation()

  const { isAuthenticated } = useAuthStore()

  /* 板块列表 */
  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: getSections,
  })

  /* 帖子列表 */
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', page, activeSection, keyword, tag],
    queryFn: () =>
      getPosts({
        page,
        pageSize,
        sectionId: activeSection || undefined,
        keyword,
        tag,
      }),
  })

  /* 切换板块时重置页码 */
  useEffect(() => {
    setPage(1)
  }, [activeSection])

  const totalPages = postsData ? Math.ceil(postsData.total / pageSize) : 1

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
            <button
              onClick={() => setActiveSection('')}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm transition-colors ${
                !activeSection
                  ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                  : 'text-star-dim hover:text-star-white hover:bg-space-700'
              }`}
            >
              {t('home.allSections')}
            </button>
            {sections?.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                    : 'text-star-dim hover:text-star-white hover:bg-space-700'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6">
        {/* 帖子列表 */}
        <main className="flex-1 space-y-4">
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
          ) : postsData?.items.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-star-dim">{t('home.noPosts')}</p>
            </div>
          ) : (
            postsData?.items.map((post) => (
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
                        <Avatar src={post.authorAvatar} alt={post.authorNickname} size="sm" />
                        <span className="text-sm text-star-dim">{post.authorNickname}</span>
                        <span className="text-xs text-star-dim/60">
                          {format(new Date(post.createdAt), 'MM-dd HH:mm')}
                        </span>
                      </div>
                      {/* 标签 */}
                      {post.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="cyan">{t}</Badge>
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