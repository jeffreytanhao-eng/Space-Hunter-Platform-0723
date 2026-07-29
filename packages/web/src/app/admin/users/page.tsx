'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { getUsers, manageUser } from '@/services/admin'
import type { AdminUser, PaginatedResponse } from '@/types'

export default function UsersManagePage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const pageSize = 10

  /* 确认弹窗状态 */
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; label: string; extra?: Record<string, unknown> } | null>(null)

  /* 积分调整弹窗 */
  const [pointsModal, setPointsModal] = useState<{ userId: string; nickname: string } | null>(null)
  const [pointsAmount, setPointsAmount] = useState('')
  const [pointsReason, setPointsReason] = useState('')

  /* 角色切换弹窗 */
  const [roleModal, setRoleModal] = useState<{ userId: string; nickname: string; currentRole: string } | null>(null)
  const [newRole, setNewRole] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res: PaginatedResponse<AdminUser> = await getUsers({ page, pageSize, keyword: keyword || undefined })
      setUsers(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('加载用户数据失败:', err)
      setUsers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, keyword])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleConfirm = async () => {
    if (!confirmAction) return
    const { id, action, extra } = confirmAction
    if (action === 'ban') {
      await manageUser(id, { banned: true })
    } else if (action === 'unban') {
      await manageUser(id, { banned: false })
    } else if (action === 'role') {
      await manageUser(id, { role: extra?.role as string })
    }
    setConfirmAction(null)
    fetchUsers()
  }

  const handlePointsAdjust = async () => {
    if (!pointsModal) return
    const amount = Number(pointsAmount)
    if (!amount || !pointsReason.trim()) return
    await manageUser(pointsModal.userId, { pointsAdjust: amount, reason: pointsReason })
    setPointsModal(null)
    setPointsAmount('')
    setPointsReason('')
    fetchUsers()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <h1 className="text-2xl font-bold text-star-white">用户管理</h1>

      {/* 搜索 */}
      <div className="mt-4 flex gap-2">
        <Input
          placeholder="搜索昵称/手机号…"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <p className="mt-4 text-star-dim">加载中…</p>
      ) : users.length === 0 ? (
        <p className="mt-4 text-star-dim">暂无用户</p>
      ) : (
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar src={user.avatar} alt={user.nickname} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-star-white">{user.nickname}</span>
                    <Badge variant={user.role === 'admin' ? 'purple' : 'default'}>{user.role}</Badge>
                    {user.banned && <Badge variant="default" className="bg-red-600/20 text-red-400">已封禁</Badge>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-star-dim">
                    <span>{user.phone || '未绑定手机'}</span>
                    <span>积分：{user.points}</span>
                    <span>注册：{new Date(user.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {user.banned ? (
                  <Button variant="primary" size="sm" onClick={() => setConfirmAction({ id: user.id, action: 'unban', label: '解封' })}>解封</Button>
                ) : (
                  <Button variant="danger" size="sm" onClick={() => setConfirmAction({ id: user.id, action: 'ban', label: '封禁' })}>封禁</Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setPointsModal({ userId: user.id, nickname: user.nickname })}>积分</Button>
                <Button variant="ghost" size="sm" onClick={() => { setRoleModal({ userId: user.id, nickname: user.nickname, currentRole: user.role }); setNewRole(user.role) }}>角色</Button>
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
            <p className="mt-2 text-sm text-star-dim">确定要「{confirmAction.label}」该用户吗？</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>取消</Button>
              <Button variant={confirmAction.action === 'ban' ? 'danger' : 'primary'} size="sm" onClick={handleConfirm}>确认</Button>
            </div>
          </div>
        </div>
      )}

      {/* 积分调整弹窗 */}
      {pointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPointsModal(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-space-800 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-star-white">积分调整</h2>
            <p className="mt-1 text-xs text-star-dim">用户：{pointsModal.nickname}</p>
            <div className="mt-4 space-y-3">
              <Input label="调整金额（正数增加，负数扣减）" type="number" value={pointsAmount} onChange={(e) => setPointsAmount(e.target.value)} />
              <Input label="原因" value={pointsReason} onChange={(e) => setPointsReason(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPointsModal(null)}>取消</Button>
              <Button variant="primary" size="sm" onClick={handlePointsAdjust}>确认</Button>
            </div>
          </div>
        </div>
      )}

      {/* 角色切换弹窗 */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setRoleModal(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-space-800 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-star-white">角色切换</h2>
            <p className="mt-1 text-xs text-star-dim">用户：{roleModal.nickname}（当前角色：{roleModal.currentRole}）</p>
            <div className="mt-4 space-y-2">
              {['user', 'moderator', 'admin'].map((role) => (
                <label key={role} className="flex cursor-pointer items-center gap-2 text-sm text-star-white">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={newRole === role}
                    onChange={() => setNewRole(role)}
                    className="accent-neon-blue"
                  />
                  {role}
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRoleModal(null)}>取消</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setRoleModal(null)
                  setConfirmAction({ id: roleModal.userId, action: 'role', label: `切换角色为 ${newRole}`, extra: { role: newRole } })
                }}
              >
                确认
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
