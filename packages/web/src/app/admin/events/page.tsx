'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPendingEvents, reviewEvent } from '@/services/admin'
import type { EventItem, PaginatedResponse } from '@/types'

export default function EventsReviewPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)
  const pageSize = 10

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res: PaginatedResponse<EventItem> = await getPendingEvents({ page, pageSize })
      setEvents(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('加载活动数据失败:', err)
      setEvents([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const handleReview = async () => {
    if (!confirmAction) return
    await reviewEvent(confirmAction.id, { action: confirmAction.action })
    setConfirmAction(null)
    fetchEvents()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <h1 className="text-2xl font-bold text-star-white">活动审核</h1>
      <p className="mt-1 text-sm text-star-dim">待审核活动共 {total} 条</p>

      {loading ? (
        <p className="mt-4 text-star-dim">加载中…</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-star-dim">暂无待审核活动</p>
      ) : (
        <div className="mt-4 space-y-3">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-medium text-star-white">{event.title}</span>
                  <Badge variant={event.locationType === 'online' ? 'cyan' : 'purple'}>
                    {event.locationType === 'online' ? '线上' : '线下'}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-star-dim">
                  <span>创建者：{event.authorNickname}</span>
                  <span>时间：{new Date(event.startTime).toLocaleString('zh-CN')}</span>
                  <span>地点：{event.location}</span>
                  <span>人数：{event.currentParticipants}/{event.maxParticipants}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="primary" size="sm" onClick={() => setConfirmAction({ id: event.id, action: 'approve' })}>通过</Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmAction({ id: event.id, action: 'reject' })}>拒绝</Button>
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

      {/* 确认操作弹窗 */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmAction(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-space-800 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-star-white">确认操作</h2>
            <p className="mt-2 text-sm text-star-dim">
              确定要{confirmAction.action === 'approve' ? '通过' : '拒绝'}该活动吗？
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
