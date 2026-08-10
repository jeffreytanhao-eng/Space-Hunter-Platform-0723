'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConversations, createConversation, getMessages, sendMessage } from '@/services/messages'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { format } from 'date-fns'
import { Send, Loader2, MessageSquare, ChevronLeft } from 'lucide-react'

function MessagesContent() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const peerIdParam = searchParams.get('peerId') || ''

  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const peerHandledRef = useRef<string | null>(null)

  /* 会话列表 */
  const { data: conversations = [], refetch: refetchConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    enabled: isAuthenticated,
  })

  const activeConv = conversations.find((c) => c.id === activeConvId) || null

  /* 消息记录 */
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', activeConvId],
    queryFn: () => getMessages(activeConvId as string),
    enabled: isAuthenticated && !!activeConvId,
  })

  /* 发起新会话（从帖子作者/关注列表进入） */
  const createConvMutation = useMutation({
    mutationFn: (peerId: string) => createConversation(peerId),
    onSuccess: (conv) => {
      setActiveConvId(conv.id)
      refetchConvs()
    },
  })

  /* 发送消息 */
  const sendMutation = useMutation({
    mutationFn: ({ convId, content }: { convId: string; content: string }) => sendMessage(convId, content),
    onSuccess: () => {
      setInput('')
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvId] })
      refetchConvs()
    },
  })

  /* 进入后：处理 peerId 发起私信，否则默认打开第一个会话 */
  useEffect(() => {
    if (!isAuthenticated) return
    if (peerIdParam && peerHandledRef.current !== peerIdParam) {
      peerHandledRef.current = peerIdParam
      createConvMutation.mutate(peerIdParam)
      return
    }
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, peerIdParam, conversations, activeConvId])

  /* 新消息滚动到底部 */
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, activeConvId])

  const handleSend = () => {
    const content = input.trim()
    if (!content || !activeConvId) return
    sendMutation.mutate({ convId: activeConvId, content })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex-1 px-4 py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-blue" />
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
          <p className="text-star-dim">请先登录查看私信</p>
          <Button variant="primary" className="mt-4" onClick={() => (window.location.href = '/login')}>去登录</Button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-xl font-bold text-star-white">私信</h1>
        <div className="grid overflow-hidden rounded-xl border border-space-600 bg-space-800 lg:grid-cols-[260px_1fr]">
          {/* 会话列表（移动端仅在未选中会话时显示） */}
          <div className={`border-r border-space-600 lg:block ${activeConv ? 'hidden' : 'block'}`}>
            <div className="border-b border-space-600 px-4 py-3 text-sm font-medium text-star-white">会话</div>
            <div className="max-h-[60vh] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-star-dim">
                  <MessageSquare className="mx-auto mb-2 h-6 w-6 text-star-dim/50" />
                  暂无会话
                  <p className="mt-1 text-xs">可从帖子作者或关注列表发起私信</p>
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-space-700 ${activeConvId === c.id ? 'bg-space-700' : ''}`}
                  >
                    <Avatar src={c.peerAvatar} alt={c.peerNickname} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-star-white">{c.peerNickname}</p>
                      {c.lastMessage && <p className="truncate text-xs text-star-dim">{c.lastMessage}</p>}
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {c.unreadCount > 99 ? '99+' : c.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 聊天面板 */}
          <div className={`flex h-[60vh] flex-col lg:flex ${activeConv ? 'flex' : 'hidden'}`}>
            <div className="flex items-center gap-3 border-b border-space-600 px-4 py-3">
              <button onClick={() => setActiveConvId(null)} className="text-star-dim hover:text-star-white lg:hidden">
                <ChevronLeft className="h-5 w-5" />
              </button>
              {activeConv ? (
                <>
                  <Avatar src={activeConv.peerAvatar} alt={activeConv.peerNickname} size="sm" />
                  <span className="text-sm font-medium text-star-white">{activeConv.peerNickname}</span>
                </>
              ) : (
                <span className="text-sm text-star-dim">选择一个会话开始聊天</span>
              )}
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {activeConv && messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-star-dim">还没有消息，打个招呼吧</p>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === user?.id
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${mine ? 'bg-neon-blue text-space-900' : 'bg-space-700 text-star-white'}`}>
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={`mt-1 text-[10px] ${mine ? 'text-space-800' : 'text-star-dim'}`}>
                          {format(new Date(m.createdAt), 'MM-dd HH:mm')}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-space-600 px-4 py-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                placeholder={activeConv ? `给 ${activeConv.peerNickname} 发消息...` : '选择会话后可发送消息'}
                disabled={!activeConv}
                className="flex-1 rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors disabled:opacity-50"
              />
              <Button
                variant="primary"
                size="sm"
                disabled={!activeConv || !input.trim() || sendMutation.isPending}
                onClick={handleSend}
              >
                {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col"><div className="mx-auto flex-1 px-4 py-20"><Skeleton className="h-64 w-full" /></div></div>}>
      <MessagesContent />
    </Suspense>
  )
}
