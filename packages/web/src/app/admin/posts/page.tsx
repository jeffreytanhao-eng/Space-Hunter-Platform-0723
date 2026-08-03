'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPendingPosts, reviewPost, getAllPosts, hidePost, showPost, deletePost } from '@/services/admin'
import type { Post, PaginatedResponse } from '@/types'

/* 帖子审核/管理页 */
export default function PostsReviewPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [previewPost, setPreviewPost] = useState<Post | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' | 'hide' | 'show' | 'delete'; title?: string } | null>(null)
  const [actionError, setActionError] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const pageSize = 10

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res: PaginatedResponse<Post> = tab === 'pending'
        ? await getPendingPosts({ page, pageSize })
        : await getAllPosts({ page, pageSize })
      setPosts(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('加载帖子数据失败:', err)
      setPosts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, tab])

  useEffect(() => { fetchPosts() }, [fetchPosts])
  useEffect(() => { setPage(1) }, [tab])

  const handleConfirm = async () => {
    if (!confirmAction) return
    setReviewing(true)
    setActionError('')
    try {
      const { id, action } = confirmAction
      if (action === 'approve' || action === 'reject') {
        await reviewPost(id, { action })
      } else if (action === 'hide') {
        await hidePost(id)
      } else if (action === 'show') {
        await showPost(id)
      } else if (action === 'delete') {
        await deletePost(id)
      }
      setConfirmAction(null)
      fetchPosts()
    } catch (err: unknown) {
      console.error('帖子操作失败:', err)
      const axiosErr = err as { response?: { data?: { message?: string | string[] } }; message?: string }
      const backendMsg = axiosErr?.response?.data?.message
      const msg = Array.isArray(backendMsg) ? backendMsg[0] : backendMsg
      setActionError(msg || axiosErr?.message || '操作失败，请稍后重试')
    } finally {
      setReviewing(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  /* 状态标签 */
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'pending_auto' || status === 'pending_manual') return <Badge variant="blue">待审核</Badge>
    if (status === 'published') return <Badge variant="green">已发布</Badge>
    if (status === 'rejected') return <Badge variant="red">已拒绝</Badge>
    if (status === 'hidden') return <Badge variant="orange">已隐藏</Badge>
    return <Badge>{status}</Badge>
  }

  /* 获取作者昵称 */
  const getAuthor = (post: Post) => {
    const raw = post as Post & { user?: { nickname?: string } }
    return raw.user?.nickname || post.authorNickname || '未知'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-star-white">帖子管理</h1>

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
      <p className="mt-2 text-sm text-star-dim">{tab === 'pending' ? '待审核' : '全部'}帖子共 {total} 条</p>

      {loading ? (
        <p className="mt-4 text-star-dim">加载中…</p>
      ) : posts.length === 0 ? (
        <p className="mt-4 text-star-dim">{tab === 'pending' ? '暂无待审核帖子' : '暂无帖子'}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-medium text-star-white">{post.title}</span>
                  {tab === 'all' && <StatusBadge status={post.status} />}
                  <Badge variant="blue">{post.sectionName || '未知板块'}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-star-dim">
                  <span>作者：{getAuthor(post)}</span>
                  <span>发布：{new Date(post.createdAt).toLocaleString('zh-CN')}</span>
                  <span>评论：{post.commentsCount}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {tab === 'pending' ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setPreviewPost(post)}>预览</Button>
                    <Button variant="primary" size="sm" onClick={() => setConfirmAction({ id: post.id, action: 'approve' })}>通过</Button>
                    <Button variant="danger" size="sm" onClick={() => setConfirmAction({ id: post.id, action: 'reject' })}>拒绝</Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setPreviewPost(post)}>预览</Button>
                    {post.status === 'hidden' ? (
                      <Button variant="primary" size="sm" onClick={() => setConfirmAction({ id: post.id, action: 'show' })}>恢复</Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ id: post.id, action: 'hide' })}>隐藏</Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => setConfirmAction({ id: post.id, action: 'delete', title: post.title })}>删除</Button>
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

      {/* 帖子内容预览弹窗 */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewPost(null)}>
          <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-space-800 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-star-white">{previewPost.title}</h2>
              <button className="text-star-dim hover:text-star-white" onClick={() => setPreviewPost(null)}>✕</button>
            </div>
            <p className="mt-1 text-xs text-star-dim">作者：{getAuthor(previewPost)} · {new Date(previewPost.createdAt).toLocaleString('zh-CN')}</p>
            <div className="mt-4 whitespace-pre-wrap text-sm text-star-white/80">{previewPost.content}</div>
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
                : `确定要${confirmAction.action === 'approve' ? '通过' : confirmAction.action === 'reject' ? '拒绝' : confirmAction.action === 'hide' ? '隐藏' : '恢复'}该帖子吗？`}
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
