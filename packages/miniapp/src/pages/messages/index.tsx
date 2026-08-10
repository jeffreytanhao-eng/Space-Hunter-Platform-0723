import { useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { messagesApi } from '@/services/api'
import type { ConversationItem } from '@/services/api'
import { isLoggedIn } from '@/stores/auth'
import './index.scss'

/** 私信会话列表页 */
export default function Messages() {
  const [list, setList] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(false)

  /** 加载会话列表 */
  const loadConversations = async () => {
    setLoading(true)
    try {
      const res = await messagesApi.getConversations()
      setList(res || [])
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
    loadConversations()
  })

  usePullDownRefresh(() => {
    loadConversations().finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  /** 进入会话 */
  const handleEnter = (conv: ConversationItem) => {
    const peerName = conv.peer?.nickname || conv.peer?.username || ''
    Taro.navigateTo({ url: `/pages/messages/chat?id=${conv.id}&peer=${encodeURIComponent(peerName)}` })
  }

  /** 格式化时间 */
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <View className='messages'>
      {/* 会话列表 */}
      <ScrollView className='messages__list' scrollY>
        {list.map(conv => (
          <View key={conv.id} className='messages__item' onClick={() => handleEnter(conv)}>
            {conv.peer?.avatar ? (
              <Image className='messages__avatar' src={conv.peer.avatar} mode='aspectFill' />
            ) : (
              <View className='messages__avatar messages__avatar--placeholder'>
                <Text className='messages__avatar-text'>
                  {(conv.peer?.nickname || conv.peer?.username || '匿')[0]}
                </Text>
              </View>
            )}
            <View className='messages__info'>
              <View className='messages__row'>
                <Text className='messages__name'>{conv.peer?.nickname || conv.peer?.username || '未知用户'}</Text>
                <Text className='messages__time'>{formatTime(conv.lastMessageAt)}</Text>
              </View>
              <View className='messages__row'>
                <Text className='messages__last'>{conv.lastMessage || '暂无消息'}</Text>
                {(conv.unreadCount || 0) > 0 && (
                  <View className='messages__badge'>
                    <Text className='messages__badge-text'>{conv.unreadCount! > 99 ? '99+' : conv.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}

        {list.length === 0 && !loading && (
          <View className='messages__empty'>
            <Text className='messages__empty-text'>暂无会话，去帖子详情页给作者发私信吧</Text>
          </View>
        )}

        {loading && (
          <View className='messages__loading'>
            <Text className='messages__loading-text'>加载中...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
