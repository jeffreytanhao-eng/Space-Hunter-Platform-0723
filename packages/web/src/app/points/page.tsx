﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBalance, getTransactions, getRewards, redeem } from '@/services/points'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { format } from 'date-fns'
import { useTranslation } from '@/lib/i18n'
import {
  Coins, TrendingUp, TrendingDown, Gift,
  ChevronLeft, ChevronRight, Loader2, Sparkles
} from 'lucide-react'

/* 积分中心页 */
export default function PointsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading } = useAuthStore()

  const [txPage, setTxPage] = useState(1)
  const [txType, setTxType] = useState<'earn' | 'spend' | undefined>(undefined)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)

  /* 积分余额 */
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['points-balance'],
    queryFn: getBalance,
    enabled: isAuthenticated,
  })

  /* 积分明细 */
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['points-transactions', txPage, txType],
    queryFn: () => getTransactions({ page: txPage, pageSize: 10, type: txType }),
    enabled: isAuthenticated,
  })

  /* 奖励列表 */
  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['points-rewards'],
    queryFn: getRewards,
    enabled: isAuthenticated,
  })

  /* 兑换 */
  const redeemMutation = useMutation({
    mutationFn: ({ rewardId, idempotencyKey }: { rewardId: string; idempotencyKey: string }) =>
      redeem(rewardId, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points-balance'] })
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] })
      setRedeemingId(null)
    },
    onError: () => {
      setRedeemingId(null)
    },
  })

  const handleRedeem = (rewardId: string) => {
    setRedeemingId(rewardId)
    const idempotencyKey = `${rewardId}-${Date.now()}`
    redeemMutation.mutate({ rewardId, idempotencyKey })
  }

  const txTotalPages = txData ? Math.ceil(txData.total / 10) : 1
  const balance = balanceData?.balance ?? 0

  /* 奖励名称/描述：查 i18n 词典，查不到则 fallback 到后端返回值 */
  const rewardName = (reward: { id: string; name: string }) => {
    const key = `rewards.${reward.id}`
    const translated = t(key)
    return translated === key ? reward.name : translated
  }
  const rewardDesc = (reward: { id: string; description?: string }) => {
    const key = `rewards.desc_${reward.id}`
    const translated = t(key)
    return translated === key ? (reward.description || '') : translated
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex-1 px-4 py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-blue" />
          <p className="mt-4 text-star-dim">{t('common.loading')}</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex-1 px-4 py-20 text-center">
          <p className="text-star-dim">{t('points.notLoggedIn')}</p>
          <Button variant="primary" className="mt-4" onClick={() => (window.location.href = '/login')}>
            {t('points.goToLogin')}
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {/* 积分余额 */}
        <Card glowColor="blue" className="mb-6 text-center">
          <div className="py-4">
            <p className="text-sm text-star-dim">{t('points.balance')}</p>
            {balanceLoading ? (
              <Skeleton className="mx-auto mt-2 h-16 w-40" />
            ) : (
              <p className="mt-2 text-6xl font-bold text-neon-cyan text-glow-cyan">
                {balance.toLocaleString()}
              </p>
            )}
            <p className="mt-2 text-sm text-star-dim">{t('points.balanceHint')}</p>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 积分明细 */}
          <Card glowColor="cyan" className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium text-star-white">{t('points.transactions')}</h2>
              {/* 筛选 */}
              <div className="flex gap-1">
                <button
                  onClick={() => { setTxType(undefined); setTxPage(1) }}
                  className={`rounded-lg px-3 py-1 text-xs transition-colors ${
                    !txType ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30' : 'text-star-dim hover:text-star-white'
                  }`}
                >
                  {t('points.all')}
                </button>
                <button
                  onClick={() => { setTxType('earn'); setTxPage(1) }}
                  className={`rounded-lg px-3 py-1 text-xs transition-colors ${
                    txType === 'earn' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'text-star-dim hover:text-star-white'
                  }`}
                >
                  {t('points.earn')}
                </button>
                <button
                  onClick={() => { setTxType('spend'); setTxPage(1) }}
                  className={`rounded-lg px-3 py-1 text-xs transition-colors ${
                    txType === 'spend' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'text-star-dim hover:text-star-white'
                  }`}
                >
                  {t('points.spend')}
                </button>
              </div>
            </div>

            {txLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : txData?.items?.length === 0 ? (
              <p className="py-8 text-center text-sm text-star-dim">{t('points.noTransactions')}</p>
            ) : (
              <div className="space-y-3">
                {txData?.items?.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-space-600 pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      {tx.type === 'earn' ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-star-white">{tx.reason}</p>
                        <p className="text-xs text-star-dim">{format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm')}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${tx.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 分页 */}
            {txTotalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setTxPage(Math.max(1, txPage - 1))}
                  disabled={txPage <= 1}
                  className="rounded-lg border border-space-600 bg-space-700 px-2 py-1 text-xs text-star-dim hover:text-star-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="text-xs text-star-dim">{txPage} / {txTotalPages}</span>
                <button
                  onClick={() => setTxPage(Math.min(txTotalPages, txPage + 1))}
                  disabled={txPage >= txTotalPages}
                  className="rounded-lg border border-space-600 bg-space-700 px-2 py-1 text-xs text-star-dim hover:text-star-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </Card>

          {/* 兑换商城 */}
          <Card glowColor="purple" className="mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-medium text-star-white">
              <Gift className="h-4 w-4 text-neon-purple" />
              {t('points.redeemShop')}
            </h2>

            {rewardsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-lg" />
                ))}
              </div>
            ) : rewards?.length === 0 ? (
              <p className="py-8 text-center text-sm text-star-dim">{t('points.noRewards')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {rewards?.map((reward) => {
                  const canRedeem = balance >= reward.pointsCost && (reward.stock === undefined || reward.stock > 0)
                  return (
                    <div
                      key={reward.id}
                      className="rounded-xl border border-space-600 bg-space-700 p-3 text-center transition-all hover:border-neon-purple/30"
                    >
                      {/* 奖励图标 */}
                      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-neon-purple/15">
                        {reward.icon ? (
                          <img src={reward.icon} alt="" className="h-8 w-8" />
                        ) : (
                          <Sparkles className="h-6 w-6 text-neon-purple" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-star-white">{rewardName(reward)}</p>
                      <p className="mt-1 text-xs text-star-dim">{rewardDesc(reward)}</p>
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <Coins className="h-3.5 w-3.5 text-neon-cyan" />
                        <span className="text-sm font-medium text-neon-cyan">{reward.pointsCost}</span>
                      </div>
                      {reward.stock !== undefined && (
                        <p className="mt-1 text-xs text-star-dim">{t('points.remaining')} {reward.stock}</p>
                      )}
                      <Button
                        variant={canRedeem ? 'primary' : 'secondary'}
                        size="sm"
                        className="mt-2 w-full"
                        disabled={!canRedeem || redeemingId === reward.id}
                        onClick={() => handleRedeem(reward.id)}
                      >
                        {redeemingId === reward.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : canRedeem ? (
                          t('points.redeem')
                        ) : (
                          t('points.insufficient')
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
