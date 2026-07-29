'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { getPointsTransactions, adjustPoints } from '@/services/admin'
import type { PointTransaction, PaginatedResponse } from '@/types'

export default function PointsManagePage() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<'' | 'earn' | 'spend'>('')
  const [loading, setLoading] = useState(true)
  const pageSize = 15

  /* 积分调整表单 */
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustUserId, setAdjustUserId] = useState('')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res: PaginatedResponse<PointTransaction> = await getPointsTransactions({
        page,
        pageSize,
        type: typeFilter || undefined,
      })
      setTransactions(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('加载积分流水失败:', err)
      setTransactions([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const handleAdjust = async () => {
    const amount = Number(adjustAmount)
    if (!adjustUserId.trim() || !amount || !adjustReason.trim()) return
    await adjustPoints({ userId: adjustUserId, amount, reason: adjustReason })
    setShowAdjust(false)
    setAdjustUserId('')
    setAdjustAmount('')
    setAdjustReason('')
    fetchTransactions()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-star-white">积分管理</h1>
          <p className="mt-1 text-sm text-star-dim">积分流水共 {total} 条</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdjust(true)}>积分调整</Button>
      </div>

      {/* 筛选 */}
      <div className="mt-4 flex gap-2">
        {([['', '全部'], ['earn', '收入'], ['spend', '支出']] as const).map(([val, label]) => (
          <Button
            key={val}
            variant={typeFilter === val ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => { setTypeFilter(val as '' | 'earn' | 'spend'); setPage(1) }}
          >
            {label}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="mt-4 text-star-dim">加载中…</p>
      ) : transactions.length === 0 ? (
        <p className="mt-4 text-star-dim">暂无积分流水</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-space-600 text-left text-xs text-star-dim">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">类型</th>
                <th className="pb-2 pr-4">金额</th>
                <th className="pb-2 pr-4">原因</th>
                <th className="pb-2">时间</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-space-700">
                  <td className="py-2.5 pr-4 text-star-dim">{tx.id.slice(0, 8)}</td>
                  <td className="py-2.5 pr-4">
                    <Badge variant={tx.type === 'earn' ? 'cyan' : 'default'}>
                      {tx.type === 'earn' ? '收入' : '支出'}
                    </Badge>
                  </td>
                  <td className={`py-2.5 pr-4 font-medium ${tx.type === 'earn' ? 'text-neon-cyan' : 'text-red-400'}`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                  </td>
                  <td className="py-2.5 pr-4 text-star-white/80">{tx.reason}</td>
                  <td className="py-2.5 text-star-dim">{new Date(tx.createdAt).toLocaleString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* 积分调整弹窗 */}
      {showAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAdjust(false)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-space-800 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-star-white">积分调整</h2>
            <div className="mt-4 space-y-3">
              <Input label="用户 ID" value={adjustUserId} onChange={(e) => setAdjustUserId(e.target.value)} />
              <Input label="金额（正数增加，负数扣减）" type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
              <Input label="原因" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAdjust(false)}>取消</Button>
              <Button variant="primary" size="sm" onClick={handleAdjust}>确认</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
