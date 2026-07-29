'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPendingSections, manageSection } from '@/services/admin'
import type { Section, PaginatedResponse } from '@/types'

/* 板块扩展：管理端需要 enabled / sortOrder 字段 */
interface SectionAdmin extends Section {
  enabled?: boolean
  sortOrder?: number
}

export default function SectionsManagePage() {
  const [sections, setSections] = useState<SectionAdmin[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; label: string } | null>(null)
  const pageSize = 20

  const fetchSections = useCallback(async () => {
    setLoading(true)
    try {
      const res: PaginatedResponse<SectionAdmin> = await getPendingSections({ page, pageSize })
      setSections(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('加载板块数据失败:', err)
      setSections([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchSections() }, [fetchSections])

  const handleConfirm = async () => {
    if (!confirmAction) return
    const { id, action } = confirmAction
    if (action === 'approve') {
      await manageSection(id, { enabled: true })
    } else if (action === 'reject') {
      await manageSection(id, { enabled: false })
    } else if (action === 'enable') {
      await manageSection(id, { enabled: true })
    } else if (action === 'disable') {
      await manageSection(id, { enabled: false })
    } else if (action === 'up' || action === 'down') {
      const idx = sections.findIndex((s) => s.id === id)
      if (idx === -1) return
      const currentOrder = sections[idx].sortOrder ?? idx
      const newOrder = action === 'up' ? currentOrder - 1 : currentOrder + 1
      await manageSection(id, { sortOrder: newOrder })
    }
    setConfirmAction(null)
    fetchSections()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <h1 className="text-2xl font-bold text-star-white">板块管理</h1>
      <p className="mt-1 text-sm text-star-dim">板块共 {total} 个</p>

      {loading ? (
        <p className="mt-4 text-star-dim">加载中…</p>
      ) : sections.length === 0 ? (
        <p className="mt-4 text-star-dim">暂无板块</p>
      ) : (
        <div className="mt-4 space-y-3">
          {sections.map((section, idx) => (
            <Card key={section.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-star-white">{section.name}</span>
                  {section.enabled ? (
                    <Badge variant="cyan">已启用</Badge>
                  ) : (
                    <Badge variant="default">已禁用</Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-star-dim">
                  <span>{section.description || '无描述'}</span>
                  <span>帖子数：{section.postsCount}</span>
                  <span>排序：{section.sortOrder ?? idx}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {/* 排序 */}
                <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => setConfirmAction({ id: section.id, action: 'up', label: '上移' })}>↑ 上移</Button>
                <Button variant="ghost" size="sm" disabled={idx === sections.length - 1} onClick={() => setConfirmAction({ id: section.id, action: 'down', label: '下移' })}>↓ 下移</Button>
                {/* 启用/禁用 */}
                {section.enabled ? (
                  <Button variant="danger" size="sm" onClick={() => setConfirmAction({ id: section.id, action: 'disable', label: '禁用' })}>禁用</Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => setConfirmAction({ id: section.id, action: 'enable', label: '启用' })}>启用</Button>
                )}
                {/* 新板块审核 */}
                {section.enabled === undefined && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => setConfirmAction({ id: section.id, action: 'approve', label: '通过' })}>通过</Button>
                    <Button variant="danger" size="sm" onClick={() => setConfirmAction({ id: section.id, action: 'reject', label: '拒绝' })}>拒绝</Button>
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

      {/* 确认操作弹窗 */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmAction(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-space-800 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-star-white">确认操作</h2>
            <p className="mt-2 text-sm text-star-dim">确定要「{confirmAction.label}」该板块吗？</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>取消</Button>
              <Button variant="primary" size="sm" onClick={handleConfirm}>确认</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
