import { useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { pointsApi, checkinApi } from '@/services/api'
import type { TransactionItem, RewardItem, CheckinStatus } from '@/services/api'
import './index.scss'

/** 积分页签 */
const TABS = [
  { key: 'balance', label: '积分余额' },
  { key: 'transactions', label: '积分明细' },
  { key: 'rewards', label: '兑换商城' },
]

/** 积分中心页 */
export default function Points() {
  const [activeTab, setActiveTab] = useState('balance')
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [rewards, setRewards] = useState<RewardItem[]>([])
  const [loading, setLoading] = useState(false)
  const [checkin, setCheckin] = useState<CheckinStatus>({ checkedToday: false, streak: 0, total: 0 })
  const [checking, setChecking] = useState(false)

  /** 加载积分余额 */
  const loadBalance = async () => {
    try {
      const res = await pointsApi.getBalance()
      setBalance(res.balance)
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 加载签到状态 */
  const loadCheckin = async () => {
    try {
      const res = await checkinApi.getStatus()
      setCheckin(res)
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 加载积分明细 */
  const loadTransactions = async () => {
    try {
      setLoading(true)
      const res = await pointsApi.getTransactions({ page: 1, pageSize: 50 })
      setTransactions(res.list || [])
    } catch {
      // 错误已在 request 层处理
    } finally {
      setLoading(false)
    }
  }

  /** 加载兑换商城 */
  const loadRewards = async () => {
    try {
      setLoading(true)
      const res = await pointsApi.getRewards({ page: 1, pageSize: 50 })
      setRewards(res.list || [])
    } catch {
      // 错误已在 request 层处理
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    loadBalance()
    loadCheckin()
    if (activeTab === 'transactions') loadTransactions()
    if (activeTab === 'rewards') loadRewards()
  })

  /** 切换页签 */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'balance') {
      loadBalance()
      loadCheckin()
    }
    if (tab === 'transactions') loadTransactions()
    if (tab === 'rewards') loadRewards()
  }

  /** 每日签到 */
  const handleCheckin = async () => {
    if (checking || checkin.checkedToday) return
    setChecking(true)
    try {
      const res = await checkinApi.checkin()
      Taro.showToast({ title: `签到成功，+${res.points} 积分`, icon: 'success' })
      if (res.streak !== undefined) setCheckin(prev => ({ ...prev, checkedToday: true, streak: res.streak, total: res.total }))
      loadBalance()
    } catch {
      // 错误已在 request 层处理
      loadCheckin()
    } finally {
      setChecking(false)
    }
  }

  /** 兑换奖品 */
  const handleRedeem = async (reward: RewardItem) => {
    if (balance < reward.pointsCost) {
      Taro.showToast({ title: '积分不足', icon: 'none' })
      return
    }
    try {
      await pointsApi.redeem(reward.id)
      Taro.showToast({ title: '兑换成功', icon: 'success' })
      loadBalance()
      loadRewards()
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 格式化时间 */
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  return (
    <View className='points'>
      {/* 页签切换 */}
      <View className='points__tabs'>
        {TABS.map(tab => (
          <View
            key={tab.key}
            className={`points__tab ${activeTab === tab.key ? 'points__tab--active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text className='points__tab-text'>{tab.label}</Text>
          </View>
        ))}
      </View>

      {/* 积分余额 */}
      {activeTab === 'balance' && (
        <View className='points__balance-section'>
          <View className='points__balance-card'>
            <Text className='points__balance-label'>当前积分</Text>
            <Text className='points__balance-value'>{balance}</Text>
            <Text className='points__balance-hint'>签到、发帖、评论均可获得积分</Text>
          </View>

          {/* 每日签到 */}
          <View className='points__checkin-card'>
            <View className='points__checkin-info'>
              <Text className='points__checkin-title'>每日签到</Text>
              <Text className='points__checkin-desc'>
                {checkin.checkedToday
                  ? `今日已签到 · 已连续 ${checkin.streak} 天`
                  : `连续签到第 ${checkin.streak} 天，签到得积分`}
              </Text>
            </View>
            <View
              className={`points__checkin-btn ${checkin.checkedToday ? 'points__checkin-btn--done' : ''}`}
              onClick={handleCheckin}
            >
              <Text className='points__checkin-btn-text'>
                {checkin.checkedToday ? '已签到' : checking ? '签到中...' : '签到'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 积分明细 */}
      {activeTab === 'transactions' && (
        <ScrollView className='points__list' scrollY>
          {transactions.map(item => (
            <View key={item.id} className='points__transaction'>
              <View className='points__transaction-info'>
                <Text className='points__transaction-desc'>{item.description}</Text>
                <Text className='points__transaction-time'>{formatTime(item.createdAt)}</Text>
              </View>
              <Text className={`points__transaction-amount ${item.type === 'earn' ? 'points__transaction-amount--earn' : 'points__transaction-amount--spend'}`}>
                {item.type === 'earn' ? '+' : '-'}{item.amount}
              </Text>
            </View>
          ))}
          {transactions.length === 0 && !loading && (
            <View className='points__empty'>
              <Text className='points__empty-text'>暂无积分记录</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* 兑换商城 */}
      {activeTab === 'rewards' && (
        <ScrollView className='points__list' scrollY>
          <View className='points__rewards-grid'>
            {rewards.map(reward => (
              <View key={reward.id} className='points__reward-card'>
                <Image className='points__reward-image' src={reward.imageUrl} mode='aspectFill' />
                <View className='points__reward-info'>
                  <Text className='points__reward-name'>{reward.name}</Text>
                  <Text className='points__reward-desc'>{reward.description}</Text>
                  <View className='points__reward-footer'>
                    <Text className='points__reward-cost'>{reward.pointsCost} 积分</Text>
                    <View
                      className={`points__reward-btn ${balance < reward.pointsCost || reward.stock <= 0 ? 'points__reward-btn--disabled' : ''}`}
                      onClick={() => handleRedeem(reward)}
                    >
                      <Text className='points__reward-btn-text'>
                        {reward.stock <= 0 ? '已兑完' : '兑换'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
          {rewards.length === 0 && !loading && (
            <View className='points__empty'>
              <Text className='points__empty-text'>暂无可兑换商品</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}
