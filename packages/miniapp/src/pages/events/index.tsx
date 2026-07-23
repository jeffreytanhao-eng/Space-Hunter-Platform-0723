import { useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { eventsApi } from '@/services/api'
import type { EventItem } from '@/services/api'
import './index.scss'

/** 活动状态映射 */
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  upcoming: { label: '即将开始', className: 'upcoming' },
  ongoing: { label: '进行中', className: 'ongoing' },
  ended: { label: '已结束', className: 'ended' },
}

const PAGE_SIZE = 10

/** 活动列表页 */
export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  /** 加载活动列表 */
  const loadEvents = async (pageNum: number, append = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await eventsApi.getEvents({ page: pageNum, pageSize: PAGE_SIZE })
      const list = res.list || []
      setEvents(append ? prev => [...prev, ...list] : list)
      setHasMore(list.length >= PAGE_SIZE)
      setPage(pageNum)
    } catch {
      // 错误已在 request 层处理
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    loadEvents(1)
  })

  usePullDownRefresh(() => {
    loadEvents(1).finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  /** 上拉加载更多 */
  const handleScrollToLower = () => {
    if (hasMore && !loading) {
      loadEvents(page + 1, true)
    }
  }

  /** 报名活动 */
  const handleSignup = async (e: EventItem) => {
    try {
      await eventsApi.signupEvent(e.id)
      Taro.showToast({ title: '报名成功', icon: 'success' })
      // 刷新列表
      loadEvents(1)
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 格式化日期 */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <View className='events'>
      <ScrollView
        className='events__list'
        scrollY
        onScrollToLower={handleScrollToLower}
      >
        {events.map(event => {
          const statusInfo = STATUS_MAP[event.status] || STATUS_MAP.ended
          return (
            <View key={event.id} className='events__card'>
              {/* 活动封面 */}
              <Image className='events__cover' src={event.coverUrl} mode='aspectFill' />

              {/* 活动状态标签 */}
              <View className={`events__status events__status--${statusInfo.className}`}>
                <Text className='events__status-text'>{statusInfo.label}</Text>
              </View>

              {/* 活动信息 */}
              <View className='events__info'>
                <Text className='events__title'>{event.title}</Text>
                <View className='events__meta'>
                  <Text className='events__meta-item'>📅 {formatDate(event.startTime)} - {formatDate(event.endTime)}</Text>
                </View>
                <View className='events__meta'>
                  <Text className='events__meta-item'>📍 {event.location}</Text>
                </View>
                <View className='events__footer'>
                  <Text className='events__signup-count'>
                    已报名 {event.signupCount}{event.maxParticipants ? `/${event.maxParticipants}` : ''} 人
                  </Text>
                  {event.status !== 'ended' && (
                    <View
                      className='events__signup-btn'
                      onClick={() => handleSignup(event)}
                    >
                      <Text className='events__signup-btn-text'>立即报名</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )
        })}

        {events.length === 0 && !loading && (
          <View className='events__empty'>
            <Text className='events__empty-text'>暂无活动</Text>
          </View>
        )}

        {loading && (
          <View className='events__loading'>
            <Text className='events__loading-text'>加载中...</Text>
          </View>
        )}

        {!hasMore && events.length > 0 && (
          <View className='events__no-more'>
            <Text className='events__no-more-text'>没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
