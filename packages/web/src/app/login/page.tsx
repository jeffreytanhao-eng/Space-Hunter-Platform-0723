﻿﻿﻿﻿'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth-store'
import { useTranslation } from '@/lib/i18n'
import { sendSmsCode } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Starfield } from '@/components/effects/starfield'
import { Phone, Shield, MessageSquare } from 'lucide-react'

/* 登录页面 */
export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuthStore()

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslation()

  /* 已登录则跳转首页 */
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, router])

  /* 倒计时效果 */
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  /* 发送验证码 */
  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      setError(t('login.invalidPhone'))
      return
    }
    setError('')
    setSendingCode(true)
    try {
      await sendSmsCode(phone)
      setCountdown(60)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('login.sendCodeFailed')
      setError(msg)
    } finally {
      setSendingCode(false)
    }
  }

  /* 登录 */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !code) {
      setError(t('login.fillRequired'))
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(phone, code)
      router.replace('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('login.loginFailed')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <Starfield />

      {/* 登录卡片 */}
      <div className="relative w-full max-w-md rounded-2xl border-glow-blue bg-space-800 p-8">
        {/* 标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-neon-blue text-glow-blue">{t('login.title')}</h1>
          <p className="mt-2 text-sm text-star-dim">{t('login.subtitle')}</p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* 手机号 */}
          <div className="space-y-1.5">
            <label className="block text-sm text-star-dim">{t('login.phoneLabel')}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-star-dim" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder={t('login.phonePlaceholder')}
                maxLength={11}
                className="w-full rounded-lg border border-space-600 bg-space-700 py-2.5 pl-10 pr-3 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
              />
            </div>
          </div>

          {/* 验证码 */}
          <div className="space-y-1.5">
            <label className="block text-sm text-star-dim">{t('login.codeLabel')}</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-star-dim" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('login.codePlaceholder')}
                  maxLength={6}
                  className="w-full rounded-lg border border-space-600 bg-space-700 py-2.5 pl-10 pr-3 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={countdown > 0 || sendingCode || phone.length !== 11}
                onClick={handleSendCode}
                className="shrink-0 whitespace-nowrap"
              >
                {sendingCode ? t('login.sending') : countdown > 0 ? `${countdown}s` : t('login.sendCode')}
              </Button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          {/* 登录按钮 */}
          <Button
            type="submit"
            size="lg"
            disabled={loading || !phone || !code}
            className="w-full"
          >
            {loading ? t('login.loggingIn') : t('login.loginBtn')}
          </Button>
        </form>

        {/* 微信登录占位 */}
        <div className="mt-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-space-600" />
            </div>
            <span className="relative bg-space-800 px-3 text-xs text-star-dim">{t('login.otherLogin')}</span>
          </div>
          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 py-2.5 text-sm text-green-400 hover:bg-green-500/20 transition-colors"
            onClick={() => setError(t('login.wechatNotAvailable'))}
          >
            <MessageSquare className="h-4 w-4" />
            {t('login.wechatLogin')}
          </button>
        </div>

        {/* 注册链接 */}
        <p className="mt-6 text-center text-sm text-star-dim">
          {t('login.noAccount')}{' '}
          <Link href="/register" className="text-neon-blue hover:underline">
            {t('login.goRegister')}
          </Link>
        </p>
      </div>
    </div>
  )
}
