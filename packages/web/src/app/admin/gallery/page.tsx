'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPendingGallery, reviewGallery } from '@/services/admin'
import type { GalleryItem, PaginatedResponse } from '@/types'

export default function GalleryReviewPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)
  const pageSize = 10

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res: PaginatedResponse<GalleryItem> = await getPendingGallery({ page, pageSize })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('加载画廊数据失败:', err)
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleReview = async () => {
    if (!confirmAction) return
    await reviewGallery(confirmAction.id, { action: confirmAction.action })
    setConfirmAction(null)
    fetchItems()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <h1 className="text-2xl font-bold text-star-white">画廊审核</h1>
      <p className="mt-1 text-sm text-star-dim">待审核作品共 {total} 条</p>

      {loading ? (
        <p className="mt-4 text-star-dim">加载中…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-star-dim">暂无待审核作品</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col">
              {/* 缩略图 */}
              <div
                className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg bg-space-700"
                onClick={() => setPreviewItem(item)}
              >
                <img
                  src={item.thumbnailUrl || item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              {/* 信息 */}
              <div className="mt-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-star-white">{item.title}</span>
                  <Badge variant="cyan">{item.category}</Badge>
                </div>
                <p className="mt-1 text-xs text-star-dim">申请者：{item.authorNickname}</p>
              </div>
              {/* 操作 */}
              <div className="mt-3 flex gap-2">
                <Button variant="primary" size="sm" className="flex-1" onClick={() => setConfirmAction({ id: item.id, action: 'approve' })}>通过</Button>
                <Button variant="danger" size="sm" className="flex-1" onClick={() => setConfirmAction({ id: item.id, action: 'reject' })}>拒绝</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-star-dim">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
          <span>{page} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
        </div>
      )}

      {/* 图片大图预览 */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewItem(null)}>
          <div className="mx-4 max-h-[90vh] max-w-4xl overflow-hidden rounded-xl bg-space-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 className="text-lg font-semibold text-star-white">{previewItem.title}</h2>
              <button className="text-star-dim hover:text-star-white" onClick={() => setPreviewItem(null)}>✕</button>
            </div>
            <div className="p-4">
              <img src={previewItem.imageUrl} alt={previewItem.title} className="max-h-[70vh] w-auto rounded-lg object-contain" />
              <p className="mt-2 text-xs text-star-dim">申请者：{previewItem.authorNickname} · {previewItem.description || '无描述'}</p>
            </div>
          </div>
        </div>
      )}

      {/* 确认操作弹窗 */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmAction(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-space-800 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-star-white">确认操作</h2>
            <p className="mt-2 text-sm text-star-dim">
              确定要{confirmAction.action === 'approve' ? '通过' : '拒绝'}该作品吗？
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>取消</Button>
              <Button variant={confirmAction.action === 'approve' ? 'primary' : 'danger'} size="sm" onClick={handleReview}>确认</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
