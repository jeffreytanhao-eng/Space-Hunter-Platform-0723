'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPendingGallery, reviewGallery, getAllGallery, hideGallery, showGallery, deleteGallery } from '@/services/admin'
import type { GalleryItem, PaginatedResponse } from '@/types'

/* 画廊审核/管理页 */
export default function GalleryReviewPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [items, setItems] = useState<GalleryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' | 'hide' | 'show' | 'delete'; title?: string } | null>(null)
  const [actionError, setActionError] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const pageSize = 10

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res: PaginatedResponse<GalleryItem> = tab === 'pending'
        ? await getPendingGallery({ page, pageSize })
        : await getAllGallery({ page, pageSize })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('加载画廊数据失败:', err)
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, tab])

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => { setPage(1) }, [tab])

  const handleConfirm = async () => {
    if (!confirmAction) return
    setReviewing(true)
    setActionError('')
    try {
      const { id, action } = confirmAction
      if (action === 'approve' || action === 'reject') {
        await reviewGallery(id, { action })
      } else if (action === 'hide') {
        await hideGallery(id)
      } else if (action === 'show') {
        await showGallery(id)
      } else if (action === 'delete') {
        await deleteGallery(id)
      }
      setConfirmAction(null)
      fetchItems()
    } catch (err: unknown) {
      console.error('画廊操作失败:', err)
      const axiosErr = err as { response?: { data?: { message?: string | string[] } }; message?: string }
      const backendMsg = axiosErr?.response?.data?.message
      const msg = Array.isArray(backendMsg) ? backendMsg[0] : backendMsg
      setActionError(msg || axiosErr?.message || '操作失败，请稍后重试')
    } finally {
      setReviewing(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  /* 获取作者昵称（兼容后端 user 嵌套和前端 authorNickname 两种格式） */
  const getAuthor = (item: GalleryItem) => {
    const raw = item as GalleryItem & { user?: { nickname?: string } }
    return raw.user?.nickname || item.authorNickname || '未知'
  }

  /* AI 初筛标签 */
  const ModerationBadge = ({ item }: { item: GalleryItem }) => {
    if (!item.moderation) return null
    const { result, matchedKeywords } = item.moderation
    const keywords = matchedKeywords || []
    if (result === 'block') {
      return <Badge variant="red" title={keywords.length ? `命中: ${keywords.join(', ')}` : '命中敏感词'}>AI 拦截</Badge>
    }
    if (result === 'suspect') {
      return <Badge variant="orange" title={keywords.length ? `命中: ${keywords.join(', ')}` : '疑似敏感词'}>AI 疑似</Badge>
    }
    return <Badge variant="green">AI 通过</Badge>
  }

  /* 状态标签 */
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'pending') return <Badge variant="blue">待审核</Badge>
    if (status === 'approved') return <Badge variant="green">已通过</Badge>
    if (status === 'rejected') return <Badge variant="red">已拒绝</Badge>
    if (status === 'hidden') return <Badge variant="orange">已隐藏</Badge>
    return <Badge>{status}</Badge>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-star-white">画廊管理</h1>

      {/* 标签切换 */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setTab('pending')}
          className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${tab === 'pending' ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30' : 'text-star-dim hover:text-star-white border border-transparent'}`}
        >
          待审核
        </button>
        <button
          onClick={() => setTab('all')}
          className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${tab === 'all' ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30' : 'text-star-dim hover:text-star-white border border-transparent'}`}
        >
          全部管理
        </button>
      </div>
      <p className="mt-2 text-sm text-star-dim">{tab === 'pending' ? '待审核' : '全部'}作品共 {total} 条</p>

      {loading ? (
        <p className="mt-4 text-star-dim">加载中…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-star-dim">{tab === 'pending' ? '暂无待审核作品' : '暂无作品'}</p>
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
                {/* AI 初筛标签 */}
                {item.moderation && (
                  <div className="absolute left-2 top-2">
                    <ModerationBadge item={item} />
                  </div>
                )}
              </div>
              {/* 信息 */}
              <div className="mt-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-star-white">{item.title}</span>
                  {tab === 'all' && <StatusBadge status={item.status} />}
                </div>
                <p className="mt-1 text-xs text-star-dim">申请者：{getAuthor(item)}</p>
                {(item.moderation?.matchedKeywords?.length || 0) > 0 && (
                  <p className="mt-0.5 text-xs text-orange-400">命中词：{item.moderation?.matchedKeywords?.join('、')}</p>
                )}
              </div>
              {/* 操作 */}
              <div className="mt-3 flex gap-2">
                {tab === 'pending' ? (
                  <>
                    <Button variant="primary" size="sm" className="flex-1" onClick={() => setConfirmAction({ id: item.id, action: 'approve' })}>通过</Button>
                    <Button variant="danger" size="sm" className="flex-1" onClick={() => setConfirmAction({ id: item.id, action: 'reject' })}>拒绝</Button>
                  </>
                ) : (
                  <>
                    {item.status === 'hidden' ? (
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmAction({ id: item.id, action: 'show' })}>恢复</Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmAction({ id: item.id, action: 'hide' })}>隐藏</Button>
                    )}
                    <Button variant="danger" size="sm" className="flex-1" onClick={() => setConfirmAction({ id: item.id, action: 'delete', title: item.title })}>删除</Button>
                  </>
                )}
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
              <p className="mt-2 text-xs text-star-dim">申请者：{getAuthor(previewItem)} · {previewItem.description || '无描述'}</p>
            </div>
          </div>
        </div>
      )}

      {/* 确认操作弹窗 */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => !reviewing && setConfirmAction(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-space-800 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-star-white">确认操作</h2>
            <p className="mt-2 text-sm text-star-dim">
              {confirmAction.action === 'delete'
                ? `确定要删除「${confirmAction.title}」吗？此操作不可撤销。`
                : `确定要${confirmAction.action === 'approve' ? '通过' : confirmAction.action === 'reject' ? '拒绝' : confirmAction.action === 'hide' ? '隐藏' : '恢复'}该作品吗？`}
            </p>
            {actionError && (
              <p className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">{actionError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" disabled={reviewing} onClick={() => setConfirmAction(null)}>取消</Button>
              <Button
                variant={confirmAction.action === 'approve' || confirmAction.action === 'show' ? 'primary' : 'danger'}
                size="sm"
                disabled={reviewing}
                onClick={handleConfirm}
              >
                {reviewing ? '处理中…' : '确认'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
