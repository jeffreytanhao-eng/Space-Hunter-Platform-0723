import apiClient from '@/lib/api'
import type { Conversation } from '@/types'

/* 私信相关 API */

interface BackendConversation {
  id: string
  peerId: string
  peer?: {
    id: string
    nickname: string
    avatar: string | null
  }
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number
}

interface BackendMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}

/* 转换后端会话格式到前端格式 */
function transformConversation(bc: BackendConversation): Conversation {
  return {
    id: bc.id,
    peerId: bc.peerId,
    peerNickname: bc.peer?.nickname || '',
    peerAvatar: bc.peer?.avatar || undefined,
    lastMessage: bc.lastMessage,
    lastMessageAt: bc.lastMessageAt,
    unreadCount: bc.unreadCount ?? 0,
  }
}

/** 获取会话列表 */
export async function getConversations() {
  const { data } = await apiClient.get<BackendConversation[]>('/messages/conversations')
  return (data || []).map(transformConversation)
}

/** 创建/获取与某用户的会话 */
export async function createConversation(peerId: string) {
  const { data } = await apiClient.post<BackendConversation>('/messages/conversations', { peerId })
  return transformConversation(data)
}

/** 获取会话消息（GET 时会话对当前用户的未读将标记为已读） */
export async function getMessages(conversationId: string) {
  const { data } = await apiClient.get<BackendMessage[]>(`/messages/conversations/${conversationId}`)
  return (data || []).map((m) => ({ ...m }))
}

/** 发送消息 */
export async function sendMessage(conversationId: string, content: string) {
  const { data } = await apiClient.post<BackendMessage>(`/messages/conversations/${conversationId}`, { content })
  return data
}
