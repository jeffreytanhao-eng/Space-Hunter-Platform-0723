﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGalleryList, applyGallery, downloadOriginal, toggleGalleryLike } from '@/services/gallery'
import { addFavorite, removeFavorite } from '@/services/favorites'
import apiClient from '@/lib/api'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Starfield } from '@/components/effects/starfield'
import { useAuthStore } from '@/stores/auth-store'
import { UserProfileModal } from '@/components/ui/user-profile-modal'
import { format } from 'date-fns'
import { useTranslation } from '@/lib/i18n'
import {
  Search, Filter, ArrowUpDown, Heart, Download, X,
  ChevronLeft, ChevronRight, Maximize2, Info, Plus,
  Loader2, Image as ImageIcon, Star, Eye, Upload, Bookmark
} from 'lucide-react'

/* 荣耀画廊页 */
export default function GalleryPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  /* 画廊分类 */
  const categories = [
    { value: '', label: t('gallery.all') },
    { value: 'deep_sky', label: t('gallery.deepSky') },
    { value: 'solar_system', label: t('gallery.solarSystem') },
    { value: 'starfield', label: t('gallery.starfield') },
    { value: 'aurora', label: t('gallery.aurora') },
    { value: 'eclipse', label: t('gallery.eclipse') },
    { value: 'other', label: t('gallery.other') },
  ]

  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<'time' | 'likes'>('time')
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const pageSize = 12

  /* Lightbox 状态 */
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showFitsMeta, setShowFitsMeta] = useState(false)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  /* 申请弹窗状态 */
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyTitle, setApplyTitle] = useState('')
  const [applyDescription, setApplyDescription] = useState('')
  const [applyCategory, setApplyCategory] = useState('')
  const [applyImage, setApplyImage] = useState<File | null>(null)
  const [applyImagePreview, setApplyImagePreview] = useState('')
  const [applyStatus, setApplyStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [applyError, setApplyError] = useState('')

  /* 画廊列表 */
  const { data: galleryData, isLoading } = useQuery({
    queryKey: ['gallery', page, category, sort, keyword],
    queryFn: () => getGalleryList({ page, pageSize, category: category || undefined, sort, keyword: keyword || undefined }),
  })

  /* 画廊点赞（乐观更新） */
  const likeMutation = useMutation({
    mutationFn: (id: string) => toggleGalleryLike(id),
    onMutate: async (id: string) => {
      const queryKey = ['gallery', page, category, sort, keyword]
      const prev = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          items: (old.items || []).map((it: any) =>
            it.id === id
              ? { ...it, isLiked: !it.isLiked, likesCount: it.isLiked ? it.likesCount - 1 : it.likesCount + 1 }
              : it
          ),
        }
      })
      return { prev }
    },
    onError: (_e: string, _vars: string, ctx: any) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['gallery', page, category, sort, keyword], ctx.prev)
      }
    },
  })

  /* 画廊收藏（乐观更新） */
  const favoriteMutation = useMutation({
    mutationFn: ({ id, favorited }: { id: string; favorited: boolean }) =>
      favorited ? removeFavorite('gallery', id) : addFavorite('gallery', id),
    onMutate: async ({ id }: { id: string; favorited: boolean }) => {
      const queryKey = ['gallery', page, category, sort, keyword]
      const prev = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          items: (old.items || []).map((it: any) =>
            it.id === id
              ? { ...it, isFavorited: !it.isFavorited, favoriteCount: (it.favoriteCount ?? 0) + (it.isFavorited ? -1 : 1) }
              : it
          ),
        }
      })
      return { prev }
    },
    onError: (_e: string, _vars: { id: string; favorited: boolean }, ctx: any) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['gallery', page, category, sort, keyword], ctx.prev)
      }
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setKeyword(searchInput.trim())
    setPage(1)
  }

  /* 选择图片 */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (applyImagePreview) URL.revokeObjectURL(applyImagePreview)
    setApplyImage(file)
    setApplyImagePreview(URL.createObjectURL(file))
  }

  /* 移除图片 */
  const handleImageRemove = () => {
    if (applyImagePreview) URL.revokeObjectURL(applyImagePreview)
    setApplyImage(null)
    setApplyImagePreview('')
  }

  /* 提交画廊申请：先上传图片，再提交 */
  const handleApply = async () => {
    if (!applyImage || !applyTitle.trim()) {
      setApplyError('请上传图片并填写标题')
      return
    }
    setApplyStatus('submitting')
    setApplyError('')
    try {
      // 1. 上传图片
      const formData = new FormData()
      formData.append('file', applyImage)
      const { data: uploadRes } = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // 2. 提交画廊申请
      await applyGallery({
        imageUrl: uploadRes.url,
        title: applyTitle.trim(),
        description: applyDescription.trim() || undefined,
        category: applyCategory || undefined,
      })
      setApplyStatus('success')
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
    } catch (err: unknown) {
      console.error('画廊申请失败:', err)
      setApplyStatus('idle')
      // 提取后端错误信息（NestJS 通常返回 { message: '...' }）
      const axiosErr = err as { response?: { data?: { message?: string | string[] } }; message?: string }
      const backendMsg = axiosErr?.response?.data?.message
      const msg = Array.isArray(backendMsg) ? backendMsg[0] : backendMsg
      setApplyError(msg || axiosErr?.message || '申请失败，请稍后重试')
    }
  }

  const handleDownload = async (id: string) => {
    try {
      const result = await downloadOriginal(id)
      window.open(result.url, '_blank')
    } catch {
      // 下载失败静默处理
    }
  }

  const items = galleryData?.items || []
  const totalPages = galleryData ? Math.ceil(galleryData.total / pageSize) : 1

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* 沉浸式 Hero 区域 */}
      <div className="relative overflow-hidden">
        <Starfield />
        {/* 深空星云渐变装饰 */}
        <div className="absolute inset-0 bg-gradient-to-b from-nebula-500/10 via-transparent to-space-900" />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 30% 40%, rgba(0,212,255,0.08), transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(179,71,217,0.08), transparent 50%)',
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-5xl font-bold text-neon-cyan text-glow-cyan md:text-6xl">
            {t('gallery.title')}
          </h1>
          <p className="mt-3 text-lg text-star-dim">{t('gallery.subtitle')}</p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="border-b border-space-600 bg-space-800/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* 分类标签 */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setPage(1) }}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    category === cat.value
                      ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                      : 'text-star-dim hover:text-star-white hover:bg-space-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* 排序 */}
              <button
                onClick={() => setSort(sort === 'time' ? 'likes' : 'time')}
                className="flex items-center gap-1.5 rounded-lg border border-space-600 bg-space-700 px-3 py-1.5 text-sm text-star-dim hover:text-star-white transition-colors"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sort === 'time' ? t('gallery.sortLatest') : t('gallery.sortHottest')}
              </button>

              {/* 搜索 */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-star-dim" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('gallery.searchPlaceholder')}
                  className="w-40 rounded-lg border border-space-600 bg-space-700 py-1.5 pl-9 pr-3 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30 transition-colors"
                />
              </form>

              {/* 申请进入画廊 */}
              {isAuthenticated && (
                <Button variant="primary" size="sm" onClick={() => setShowApplyModal(true)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t('gallery.applyBtn')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 瀑布流画廊 */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {isLoading ? (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid">
                <Skeleton className="w-full" style={{ height: `${200 + Math.random() * 200}px` }} />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-star-dim/40" />
            <p className="mt-4 text-star-dim">{t('gallery.noPhotos')}</p>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="group relative mb-4 cursor-pointer break-inside-avoid overflow-hidden rounded-xl border border-space-600 bg-space-800 transition-all hover:border-neon-cyan/40 hover:shadow-lg hover:shadow-neon-cyan/5"
                onClick={() => setLightboxIndex(index)}
              >
                {/* 图片 */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* 悬浮信息层 */}
                <div className="absolute inset-0 bg-gradient-to-t from-space-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-medium text-star-white line-clamp-1">{item.title}</h3>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setProfileUserId(item.authorId) }}
                          className="group flex items-center gap-2"
                        >
                          <Avatar src={item.authorAvatar} alt={item.authorNickname} size="sm" />
                          <span className="text-xs text-star-dim group-hover:text-neon-blue transition-colors">{item.authorNickname}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-star-dim">
                        <button
                          onClick={(e) => { e.stopPropagation(); isAuthenticated && likeMutation.mutate(item.id) }}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 transition-colors ${item.isLiked ? 'text-red-400' : 'hover:text-red-400'} ${!isAuthenticated ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                          <Heart className={`h-3 w-3 ${item.isLiked ? 'fill-current' : ''}`} />
                          {item.likesCount}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); isAuthenticated && favoriteMutation.mutate({ id: item.id, favorited: !!item.isFavorited }) }}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 transition-colors ${item.isFavorited ? 'text-neon-cyan' : 'hover:text-neon-cyan'} ${!isAuthenticated ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                          <Bookmark className={`h-3 w-3 ${item.isFavorited ? 'fill-current' : ''}`} />
                          {item.favoriteCount ?? 0}
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* 操作按钮 */}
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(item.id) }}
                      className="rounded-lg bg-space-900/60 p-1.5 text-star-dim hover:text-neon-cyan transition-colors backdrop-blur-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(index) }}
                      className="rounded-lg bg-space-900/60 p-1.5 text-star-dim hover:text-neon-cyan transition-colors backdrop-blur-sm"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {/* FITS 标记 */}
                {item.fitsMeta && (
                  <div className="absolute left-2 top-2">
                    <Badge variant="purple">FITS</Badge>
                  </div>
                )}
              </div>
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

      {/* Lightbox 大图查看 */}
      {lightboxIndex !== null && items[lightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-space-900/95 backdrop-blur-md" onClick={() => { setLightboxIndex(null); setShowFitsMeta(false) }}>
          <div className="relative flex h-full w-full max-w-6xl flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
              <button onClick={() => setProfileUserId(items[lightboxIndex].authorId)} className="group flex items-center gap-3">
                <Avatar src={items[lightboxIndex].authorAvatar} alt={items[lightboxIndex].authorNickname} size="sm" />
                <div className="text-left">
                  <p className="text-sm font-medium text-star-white group-hover:text-neon-blue transition-colors">{items[lightboxIndex].authorNickname}</p>
                  <p className="text-xs text-star-dim">{format(new Date(items[lightboxIndex].createdAt), 'yyyy-MM-dd')}</p>
                </div>
              </button>
            </div>
              <div className="flex items-center gap-2">
                {items[lightboxIndex].fitsMeta && (
                  <Button variant="ghost" size="sm" onClick={() => setShowFitsMeta(!showFitsMeta)}>
                    <Info className="mr-1 h-4 w-4" />
                    {t('gallery.fitsMetadata')}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleDownload(items[lightboxIndex].id)}>
                  <Download className="mr-1 h-4 w-4" />
                  {t('gallery.download')}
                </Button>
                <button onClick={() => { setLightboxIndex(null); setShowFitsMeta(false) }} className="rounded-lg p-2 text-star-dim hover:text-star-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 大图区域 */}
            <div className="relative flex flex-1 items-center justify-center px-6">
              {/* 左切换 */}
              {lightboxIndex > 0 && (
                <button
                  onClick={() => { setLightboxIndex(lightboxIndex - 1); setShowFitsMeta(false) }}
                  className="absolute left-2 z-10 rounded-full bg-space-800/60 p-2 text-star-dim hover:text-star-white backdrop-blur-sm transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              <img
                src={items[lightboxIndex].imageUrl}
                alt={items[lightboxIndex].title}
                className="max-h-[75vh] max-w-full rounded-lg object-contain"
              />

              {/* 右切换 */}
              {lightboxIndex < items.length - 1 && (
                <button
                  onClick={() => { setLightboxIndex(lightboxIndex + 1); setShowFitsMeta(false) }}
                  className="absolute right-2 z-10 rounded-full bg-space-800/60 p-2 text-star-dim hover:text-star-white backdrop-blur-sm transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* 底部信息 */}
            <div className="px-6 py-3">
              <h2 className="text-lg font-medium text-star-white">{items[lightboxIndex].title}</h2>
              {items[lightboxIndex].description && (
                <p className="mt-1 text-sm text-star-dim">{items[lightboxIndex].description}</p>
              )}
              <div className="mt-2 flex items-center gap-4 text-sm text-star-dim">
                <button
                  onClick={() => isAuthenticated && likeMutation.mutate(items[lightboxIndex].id)}
                  className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${items[lightboxIndex].isLiked ? 'text-red-400' : 'hover:text-red-400'} ${!isAuthenticated ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <Heart className={`h-4 w-4 ${items[lightboxIndex].isLiked ? 'fill-current' : ''}`} />
                  {items[lightboxIndex].likesCount}
                </button>
                <button
                  onClick={() => isAuthenticated && favoriteMutation.mutate({ id: items[lightboxIndex].id, favorited: !!items[lightboxIndex].isFavorited })}
                  className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${items[lightboxIndex].isFavorited ? 'text-neon-cyan' : 'hover:text-neon-cyan'} ${!isAuthenticated ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <Bookmark className={`h-4 w-4 ${items[lightboxIndex].isFavorited ? 'fill-current' : ''}`} />
                  {items[lightboxIndex].favoriteCount ?? 0}
                </button>
                <Badge variant="cyan">{categories.find(c => c.value === items[lightboxIndex].category)?.label || items[lightboxIndex].category}</Badge>
              </div>
            </div>

            {/* FITS 元数据浮层 */}
            {showFitsMeta && items[lightboxIndex].fitsMeta && (
              <div className="absolute right-6 top-16 w-72 rounded-xl border-glow-purple bg-space-800/95 p-4 backdrop-blur-md">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-neon-purple">
                  <Star className="h-4 w-4" />
                  {t('gallery.fitsMetadata')}
                </h4>
                <div className="space-y-2 text-sm">
                  {items[lightboxIndex].fitsMeta!.object && (
                    <div className="flex justify-between">
                      <span className="text-star-dim">{t('post.fitsObject')}</span>
                      <span className="text-star-white">{items[lightboxIndex].fitsMeta!.object}</span>
                    </div>
                  )}
                  {items[lightboxIndex].fitsMeta!.telescope && (
                    <div className="flex justify-between">
                      <span className="text-star-dim">{t('post.fitsTelescope')}</span>
                      <span className="text-star-white">{items[lightboxIndex].fitsMeta!.telescope}</span>
                    </div>
                  )}
                  {items[lightboxIndex].fitsMeta!.exposure && (
                    <div className="flex justify-between">
                      <span className="text-star-dim">{t('post.fitsExposure')}</span>
                      <span className="text-star-white">{items[lightboxIndex].fitsMeta!.exposure}</span>
                    </div>
                  )}
                  {items[lightboxIndex].fitsMeta!.filter && (
                    <div className="flex justify-between">
                      <span className="text-star-dim">{t('post.fitsFilter')}</span>
                      <span className="text-star-white">{items[lightboxIndex].fitsMeta!.filter}</span>
                    </div>
                  )}
                  {items[lightboxIndex].fitsMeta!.dateObs && (
                    <div className="flex justify-between">
                      <span className="text-star-dim">{t('post.fitsDateObs')}</span>
                      <span className="text-star-white">{items[lightboxIndex].fitsMeta!.dateObs}</span>
                    </div>
                  )}
                  {items[lightboxIndex].fitsMeta!.resolution && (
                    <div className="flex justify-between">
                      <span className="text-star-dim">{t('post.fitsResolution')}</span>
                      <span className="text-star-white">{items[lightboxIndex].fitsMeta!.resolution}</span>
                    </div>
                  )}
                  {items[lightboxIndex].fitsMeta!.fileSize && (
                    <div className="flex justify-between">
                      <span className="text-star-dim">{t('post.fitsFileSize')}</span>
                      <span className="text-star-white">{(items[lightboxIndex].fitsMeta!.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 画廊申请弹窗 */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-space-900/80 backdrop-blur-sm" onClick={() => setShowApplyModal(false)}>
          <div className="w-full max-w-lg rounded-xl border-glow-cyan bg-space-800 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-star-white">{t('gallery.applyModalTitle')}</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-star-dim hover:text-star-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {applyStatus === 'success' ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neon-cyan/15">
                  <Star className="h-6 w-6 text-neon-cyan" />
                </div>
                <p className="text-star-white">{t('gallery.applySuccess')}</p>
                <p className="mt-1 text-sm text-star-dim">{t('gallery.applySuccessHint')}</p>
                <Button variant="primary" className="mt-4" onClick={() => { setShowApplyModal(false); setApplyStatus('idle'); setApplyTitle(''); setApplyDescription(''); setApplyCategory(''); handleImageRemove() }}>
                  {t('gallery.applyClose')}
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* 图片上传 */}
                <div className="space-y-1.5">
                  <label className="block text-sm text-star-dim">{t('gallery.applySelectPhoto')} *</label>
                  {applyImagePreview ? (
                    <div className="group relative overflow-hidden rounded-lg border border-space-600">
                      <img src={applyImagePreview} alt="" className="h-48 w-full object-cover" />
                      <button
                        onClick={handleImageRemove}
                        className="absolute right-2 top-2 rounded-full bg-space-900/70 p-1 text-star-dim hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-space-600 bg-space-700/50 p-6 transition-colors hover:border-neon-cyan/40">
                      <Upload className="h-8 w-8 text-star-dim" />
                      <p className="mt-2 text-sm text-star-dim">{t('gallery.applyUploadHint')}</p>
                      <p className="mt-1 text-xs text-star-dim/60">JPG / PNG / GIF / FITS</p>
                      <input
                        type="file"
                        accept="image/*,.fits,.fit,.fts"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 标题 */}
                <div className="space-y-1.5">
                  <label className="block text-sm text-star-dim">{t('gallery.applyTitle')} *</label>
                  <input
                    type="text"
                    value={applyTitle}
                    onChange={(e) => setApplyTitle(e.target.value)}
                    placeholder={t('gallery.applyTitlePlaceholder')}
                    className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30 transition-colors"
                  />
                </div>

                {/* 分类 */}
                <div className="space-y-1.5">
                  <label className="block text-sm text-star-dim">{t('gallery.applyCategory')}</label>
                  <select
                    value={applyCategory}
                    onChange={(e) => setApplyCategory(e.target.value)}
                    className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30 transition-colors"
                  >
                    {categories.filter(c => c.value).map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* 描述 */}
                <div className="space-y-1.5">
                  <label className="block text-sm text-star-dim">{t('gallery.applyDescription')}</label>
                  <textarea
                    value={applyDescription}
                    onChange={(e) => setApplyDescription(e.target.value)}
                    rows={3}
                    placeholder={t('gallery.applyDescriptionPlaceholder')}
                    className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30 resize-none transition-colors"
                  />
                </div>

                {/* 错误提示 */}
                {applyError && (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {applyError}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowApplyModal(false)}>{t('gallery.cancel')}</Button>
                  <Button
                    onClick={handleApply}
                    disabled={!applyImage || !applyTitle.trim() || applyStatus === 'submitting'}
                  >
                    {applyStatus === 'submitting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('gallery.applySubmit')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 用户资料弹窗 */}
      {profileUserId && (
        <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}

      <Footer />
    </div>
  )
}
