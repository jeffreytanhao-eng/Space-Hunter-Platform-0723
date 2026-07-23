'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createEvent } from '@/services/events'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

/* 创建活动页 */
export default function NewEventPage() {
  const { isAuthenticated } = useAuthStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [locationType, setLocationType] = useState<'online' | 'offline'>('online')
  const [location, setLocation] = useState('')
  const [maxParticipants, setMaxParticipants] = useState(50)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => setSubmitStatus('success'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !startTime || !endTime || !location.trim()) return
    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      startTime,
      endTime,
      locationType,
      location: location.trim(),
      maxParticipants,
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex-1 px-4 py-20 text-center">
          <p className="text-star-dim">请先登录</p>
          <Link href="/login">
            <Button variant="primary" className="mt-4">去登录</Button>
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  if (submitStatus === 'success') {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex-1 px-4 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-cyan/15">
            <CheckCircle className="h-8 w-8 text-neon-cyan" />
          </div>
          <h2 className="text-xl font-medium text-star-white">活动创建成功</h2>
          <p className="mt-2 text-sm text-star-dim">活动已提交，等待管理员审核</p>
          <Link href="/events">
            <Button variant="primary" className="mt-6">返回活动列表</Button>
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <Link href="/events" className="mb-4 inline-flex items-center gap-1 text-sm text-star-dim hover:text-star-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          返回活动列表
        </Link>

        <h1 className="text-2xl font-bold text-star-white">创建活动</h1>
        <p className="mt-1 text-sm text-star-dim">填写以下信息创建一个新的天文活动</p>

        <Card glowColor="blue" className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 标题 */}
            <div className="space-y-1.5">
              <label className="block text-sm text-star-dim">活动标题 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="如：夏季银河观测之夜"
                className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
              />
            </div>

            {/* 描述 */}
            <div className="space-y-1.5">
              <label className="block text-sm text-star-dim">活动描述 *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="详细描述活动内容、注意事项等..."
                className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 resize-none transition-colors"
              />
            </div>

            {/* 时间 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm text-star-dim">开始时间 *</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm text-star-dim">结束时间 *</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
                />
              </div>
            </div>

            {/* 地点类型 */}
            <div className="space-y-1.5">
              <label className="block text-sm text-star-dim">地点类型</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setLocationType('online')}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                    locationType === 'online'
                      ? 'border-neon-blue/50 bg-neon-blue/10 text-neon-blue'
                      : 'border-space-600 bg-space-700 text-star-dim hover:text-star-white'
                  }`}
                >
                  线上
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('offline')}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                    locationType === 'offline'
                      ? 'border-neon-blue/50 bg-neon-blue/10 text-neon-blue'
                      : 'border-space-600 bg-space-700 text-star-dim hover:text-star-white'
                  }`}
                >
                  线下
                </button>
              </div>
            </div>

            {/* 地点 */}
            <div className="space-y-1.5">
              <label className="block text-sm text-star-dim">
                {locationType === 'online' ? '会议链接/平台' : '活动地点'} *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={locationType === 'online' ? '如：腾讯会议 123-456-789' : '如：北京天文馆'}
                className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
              />
            </div>

            {/* 人数上限 */}
            <div className="space-y-1.5">
              <label className="block text-sm text-star-dim">人数上限</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                min={1}
                max={10000}
                className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/events">
                <Button variant="ghost" type="button">取消</Button>
              </Link>
              <Button
                type="submit"
                disabled={!title.trim() || !description.trim() || !startTime || !endTime || !location.trim() || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                提交审核
              </Button>
            </div>
          </form>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
