import apiClient from '@/lib/api'
import type { PointTransaction, PaginatedResponse, TransactionQuery, Reward } from '@/types'

/* 积分相关 API */

/** 获取积分余额 */
export async function getBalance() {
  const { data } = await apiClient.get<{ balance: number }>('/points/balance')
  return data
}

/** 获取积分明细 */
export async function getTransactions(query?: TransactionQuery) {
  const { data } = await apiClient.get<PaginatedResponse<PointTransaction>>('/points/transactions', {
    params: query,
  })
  return data
}

/** 获取奖励列表 */
export async function getRewards() {
  const { data } = await apiClient.get<Reward[]>('/points/rewards')
  return data
}

/** 兑换奖励 */
export async function redeem(rewardId: string, idempotencyKey: string) {
  const { data } = await apiClient.post('/points/redeem', { rewardId, idempotencyKey })
  return data
}
