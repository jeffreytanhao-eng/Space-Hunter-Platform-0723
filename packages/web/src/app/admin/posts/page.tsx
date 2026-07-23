'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPendingPosts, reviewPost } from '@/services/admin'
import type { Post, PaginatedResponse } from '@/types'

export default function PostsReviewPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [previewPost, setPreviewPost] = useState<Post | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)
  const pageSize = 10

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res: PaginatedResponse<Post> = await getPendingPosts({ page, pageSize })
      setPosts(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleReview = async () => {
    if (!confirmAction) return
    await reviewPost(confirmAction.id, { action: confirmAction.action })
    setConfirmAction(null)
    fetchPosts()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <h1 className="text-2xl font-bold text-star-white">帖子审核</h1>
      <p className="mt-1 text-sm text-star-dim">待审核帖子共 {total} 条</p>

      {loading ? (
        <p className="mt-4 text-star-dim">加载中…</p>
      ) : posts.length === 0 ? (
        <p className="mt-4 text-star-dim">暂无待审核帖子</p>
      ) : (
        <div className="mt-4 space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-medium text-star-white">{post.title}</span>
                  <Badge variant="blue">{post.sectionName || '未知板块'}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-star-dim">
                  <span>作者：{post.authorNickname}</span>
                  <span>发布：{new Date(post.createdAt).toLocaleString('zh-CN')}</span>
                  <span>评论：{post.commentsCount}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPreviewPost(post)}>预览</Button>
                <Button variant="primary" size="sm" onClick={() => setConfirmAction({ id: post.id, action: 'approve' })}>通过</Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmAction({ id: post.id, action: 'reject' })}>拒绝</Button>
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

      {/* 帖子内容预览弹窗 */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewPost(null)}>
          <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-space-800 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-star-white">{previewPost.title}</h2>
              <button className="text-star-dim hover:text-star-white" onClick={() => setPreviewPost(null)}>✕</button>
            </div>
            <p className="mt-1 text-xs text-star-dim">作者：{previewPost.authorNickname} · {new Date(previewPost.createdAt).toLocaleString('zh-CN')}</p>
            <div className="mt-4 whitespace-pre-wrap text-sm text-star-white/80">{previewPost.content}</div>
          </div>
        </div>
      )}

      {/* 确认操作弹窗 */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmAction(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-space-800 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-star-white">确认操作</h2>
            <p className="mt-2 text-sm text-star-dim">
              确定要{confirmAction.action === 'approve' ? '通过' : '拒绝'}该帖子吗？
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
