import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { notificationsApi } from '@/services/api'
import type { NotificationItem } from '@/services/api'
import { isLoggedIn } from '@/stores/auth'
import './index.scss'

const PAGE_SIZE = 20

/** 消息通知页 */
export default function Notifications() {
  const [list, setList] = useState<NotificationItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  /** 加载通知列表 */
  const loadNotifications = async (pageNum: number, append = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await notificationsApi.getNotifications({ page: pageNum, pageSize: PAGE_SIZE })
      const data = res.data || []
      setList(append ? prev => [...prev, ...data] : data)
      setHasMore(data.length >= PAGE_SIZE)
      setPage(pageNum)
    } catch {
      // 错误已在 request 层处理
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.redirectTo({ url: '/pages/login/index' })
      return
    }
    setList([])
    setHasMore(true)
    loadNotifications(1)
  })

  /** 上拉加载更多 */
  const handleScrollToLower = () => {
    if (hasMore && !loading) {
      loadNotifications(page + 1, true)
    }
  }

  /** 点击通知，标记已读 */
  const handleTap = async (item: NotificationItem) => {
    if (item.read) return
    try {
      await notificationsApi.markRead(item.id)
      setList(prev => prev.map(x => x.id === item.id ? { ...x, read: true } : x))
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 全部标记已读 */
  const handleReadAll = async () => {
    try {
      await notificationsApi.readAll()
      setList(prev => prev.map(x => ({ ...x, read: true })))
      Taro.showToast({ title: '已全部标记为已读', icon: 'none' })
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 格式化时间 */
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  return (
    <View className='notifications'>
      {/* 全部已读 */}
      <View className='notifications__toolbar'>
        <Text className='notifications__toolbar-text' onClick={handleReadAll}>全部已读</Text>
      </View>

      {/* 通知列表 */}
      <ScrollView className='notifications__list' scrollY onScrollToLower={handleScrollToLower}>
        {list.map(item => (
          <View
            key={item.id}
            className={`notifications__item ${item.read ? '' : 'notifications__item--unread'}`}
            onClick={() => handleTap(item)}
          >
            <View className='notifications__content'>
              <Text className='notifications__title'>{item.title || '系统通知'}</Text>
              <Text className='notifications__body'>{item.content}</Text>
              <Text className='notifications__time'>{formatTime(item.createdAt)}</Text>
            </View>
            {!item.read && <View className='notifications__dot' />}
          </View>
        ))}

        {list.length === 0 && !loading && (
          <View className='notifications__empty'>
            <Text className='notifications__empty-text'>暂无通知</Text>
          </View>
        )}

        {loading && (
          <View className='notifications__loading'>
            <Text className='notifications__loading-text'>加载中...</Text>
          </View>
        )}

        {!hasMore && list.length > 0 && (
          <View className='notifications__no-more'>
            <Text className='notifications__no-more-text'>没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
