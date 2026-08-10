import { useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { messagesApi } from '@/services/api'
import type { MessageItem } from '@/services/api'
import { getUser, isLoggedIn } from '@/stores/auth'
import './index.scss'

/** 私信会话聊天页 */
export default function Chat() {
  const router = useRouter()
  const conversationId = router.params.id || ''
  const peerName = decodeURIComponent(router.params.peer || '')
  const currentUser = getUser()

  const [messages, setMessages] = useState<MessageItem[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  /** 加载消息列表 */
  const loadMessages = async () => {
    if (!conversationId) return
    try {
      setLoading(true)
      const res = await messagesApi.getMessages(conversationId)
      setMessages(res || [])
    } catch {
      // 错误已在 request 层处理
    } finally {
      setLoading(false)
    }
  }

  if (conversationId && loading && messages.length === 0) {
    loadMessages()
  }

  /** 发送消息 */
  const handleSend = async () => {
    if (!conversationId || !text.trim() || sending) return
    setSending(true)
    try {
      const msg = await messagesApi.sendMessage(conversationId, text.trim())
      setMessages(prev => [...prev, msg])
      setText('')
    } catch {
      // 错误已在 request 层处理
    } finally {
      setSending(false)
    }
  }

  /** 格式化时间 */
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (!isLoggedIn()) {
    return null
  }

  return (
    <View className='chat'>
      {/* 消息列表 */}
      <ScrollView
        className='chat__list'
        scrollY
        scrollIntoView='chat-bottom'
      >
        {messages.map(msg => {
          const mine = currentUser?.id === msg.senderId
          return (
            <View key={msg.id} className={`chat__row ${mine ? 'chat__row--mine' : 'chat__row--peer'}`}>
              <View className='chat__bubble'>
                <Text className='chat__bubble-text'>{msg.content}</Text>
              </View>
              <Text className='chat__time'>{formatTime(msg.createdAt)}</Text>
            </View>
          )
        })}

        <View id='chat-bottom' />

        {messages.length === 0 && !loading && (
          <View className='chat__empty'>
            <Text className='chat__empty-text'>和 {peerName || '对方'} 打个招呼吧</Text>
          </View>
        )}

        {loading && (
          <View className='chat__loading'>
            <Text className='chat__loading-text'>加载中...</Text>
          </View>
        )}
      </ScrollView>

      {/* 输入栏 */}
      <View className='chat__input-bar'>
        <Input
          className='chat__input'
          placeholder='输入消息...'
          placeholderStyle='color: #64748b'
          value={text}
          onInput={e => setText(e.detail.value)}
          confirmType='send'
          onConfirm={handleSend}
        />
        <View className='chat__send-btn' onClick={handleSend}>
          <Text className='chat__send-btn-text'>发送</Text>
        </View>
      </View>
    </View>
  )
}
