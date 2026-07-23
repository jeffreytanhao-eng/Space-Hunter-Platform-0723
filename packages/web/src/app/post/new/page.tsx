'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createPost } from '@/services/posts'
import { getSections } from '@/services/sections'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { useTranslation } from '@/lib/i18n'
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react'

/* 图片预览项 */
interface ImagePreview {
  file: File
  url: string
  isFits: boolean
  processingStatus?: 'pending' | 'processing' | 'done' | 'failed'
}

/* 发帖页面 */
export default function NewPostPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [sectionId, setSectionId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [images, setImages] = useState<ImagePreview[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  /* 板块列表 */
  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: getSections,
  })

  /* 判断是否为 FITS/TIFF/RAW 文件 */
  const isSpecialFile = (name: string) => {
    const ext = name.toLowerCase().split('.').pop()
    return ['fits', 'fit', 'fts', 'tiff', 'tif', 'raw', 'cr2', 'nef', 'arw'].includes(ext || '')
  }

  /* 添加图片 */
  const addImages = useCallback((files: FileList | File[]) => {
    const newImages: ImagePreview[] = []
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/') && !isSpecialFile(file.name)) return
      newImages.push({
        file,
        url: URL.createObjectURL(file),
        isFits: isSpecialFile(file.name),
        processingStatus: isSpecialFile(file.name) ? 'pending' : undefined,
      })
    })
    setImages((prev) => [...prev, ...newImages])
  }, [])

  /* 移除图片 */
  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  /* 拖拽处理 */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      addImages(e.dataTransfer.files)
    }
  }

  /* 添加标签 */
  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
  }

  /* 移除标签 */
  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  /* 提交发帖 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sectionId) {
      setError(t('post.noSection'))
      return
    }
    if (!title.trim()) {
      setError(t('post.noTitle'))
      return
    }
    if (!content.trim()) {
      setError(t('post.noContent'))
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const postData = {
        sectionId,
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
        images: images.map((img) => img.file),
      }
      const result = await createPost(postData)
      router.replace(`/post/${result.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '发帖失败，请稍后重试'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  /* 未登录提示 */
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex-1 px-4 py-20 text-center">
          <p className="text-star-dim">{t('post.loginRequired')}</p>
          <Button variant="primary" className="mt-4" onClick={() => router.push('/login')}>
            {t('common.goToLogin')}
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-star-white">{t('post.newTitle')}</h1>

        <form onSubmit={handleSubmit}>
          <Card glowColor="blue" className="space-y-5">
            {/* 选择板块 */}
            <div className="space-y-1.5">
              <label className="block text-sm text-star-dim">{t('post.selectSection')} *</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
              >
                <option value="">{t('post.selectSectionPlaceholder')}</option>
                {sections?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 标题 */}
            <div className="space-y-1.5">
              <label className="block text-sm text-star-dim">{t('post.title')} *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('post.titlePlaceholder')}
                maxLength={100}
                className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
              />
            </div>

            {/* 正文 */}
            <div className="space-y-1.5">
              <label className="block text-sm text-star-dim">{t('post.content')} *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('post.contentPlaceholder')}
                rows={8}
                className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 resize-none transition-colors"
              />
            </div>

            {/* 标签 */}
            <div className="space-y-1.5">
              <label className="block text-sm text-star-dim">{t('post.tags')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder={t('post.tagPlaceholder')}
                  className="flex-1 rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
                />
                <Button type="button" variant="secondary" size="md" onClick={addTag}>
                  {t('post.addTag')}
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="cyan" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 图片上传 */}
            <div className="space-y-1.5">
              <label className="block text-sm text-star-dim">{t('post.imageUpload')}</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  dragOver
                    ? 'border-neon-blue bg-neon-blue/5'
                    : 'border-space-600 bg-space-700/50 hover:border-space-600/80'
                }`}
              >
                <ImagePlus className="mx-auto h-8 w-8 text-star-dim" />
                <p className="mt-2 text-sm text-star-dim">{t('post.imageUploadDrag')}</p>
                <p className="mt-1 text-xs text-star-dim/60">
                  {t('post.imageUploadHint')}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.fits,.fit,.fts,.tiff,.tif,.raw,.cr2,.nef,.arw"
                  onChange={(e) => e.target.files && addImages(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* 图片预览 */}
              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((img, index) => (
                    <div key={index} className="group relative overflow-hidden rounded-lg border border-space-600">
                      <img
                        src={img.url}
                        alt=""
                        className="h-24 w-full object-cover"
                      />
                      {/* FITS 标记 */}
                      {img.isFits && (
                        <Badge variant="purple" className="absolute left-1 top-1 text-[10px]">FITS</Badge>
                      )}
                      {/* 处理中状态 */}
                      {img.processingStatus && img.processingStatus !== 'done' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-space-900/70">
                          <Loader2 className="h-5 w-5 animate-spin text-neon-cyan" />
                        </div>
                      )}
                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(index)
                        }}
                        className="absolute right-1 top-1 rounded-full bg-space-900/70 p-0.5 text-star-dim opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                {t('post.cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('post.submitting')}
                  </>
                ) : (
                  t('post.submit')
                )}
              </Button>
            </div>
          </Card>
        </form>
      </main>

      <Footer />
    </div>
  )
}
