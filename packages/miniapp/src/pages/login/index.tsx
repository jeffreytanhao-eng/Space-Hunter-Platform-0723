import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authApi } from '@/services/api'
import { setToken, setUser } from '@/stores/auth'
import type { AuthUser } from '@/services/api'
import './index.scss'

/** 登录页 */
export default function Login() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)

  /** 微信一键登录 */
  const handleWechatLogin = async () => {
    try {
      setLoading(true)
      const loginRes = await Taro.login()
      if (!loginRes.code) {
        Taro.showToast({ title: '微信登录失败', icon: 'none' })
        return
      }
      const data = await authApi.wechatLogin(loginRes.code)
      handleLoginSuccess(data.token, data.user)
    } catch {
      // 错误已在 request 层处理
    } finally {
      setLoading(false)
    }
  }

  /** 发送验证码 */
  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (countdown > 0) return
    try {
      await authApi.sendSmsCode(phone)
      Taro.showToast({ title: '验证码已发送', icon: 'success' })
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 手机号+验证码登录 */
  const handlePhoneLogin = async () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!code || code.length < 4) {
      Taro.showToast({ title: '请输入验证码', icon: 'none' })
      return
    }
    try {
      setLoading(true)
      const data = await authApi.login(phone, code)
      handleLoginSuccess(data.token, data.user)
    } catch {
      // 错误已在 request 层处理
    } finally {
      setLoading(false)
    }
  }

  /** 登录成功处理 */
  const handleLoginSuccess = (token: string, user: AuthUser) => {
    setToken(token)
    setUser(user)
    Taro.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/index/index' })
    }, 1000)
  }

  return (
    <View className='login'>
      {/* 深空背景装饰 */}
      <View className='login__stars' />

      {/* Logo 区域 */}
      <View className='login__header'>
        <View className='login__logo'>
          <Text className='login__logo-text'>🚀</Text>
        </View>
        <Text className='login__title'>太空猎人</Text>
        <Text className='login__subtitle'>探索宇宙，分享星空</Text>
      </View>

      {/* 微信一键登录 */}
      <View className='login__section'>
        <Button
          className='login__wx-btn'
          onClick={handleWechatLogin}
          disabled={loading}
        >
          <Text className='login__wx-btn-text'>微信一键登录</Text>
        </Button>
      </View>

      {/* 分隔线 */}
      <View className='login__divider'>
        <View className='login__divider-line' />
        <Text className='login__divider-text'>或使用手机号登录</Text>
        <View className='login__divider-line' />
      </View>

      {/* 手机号+验证码登录表单 */}
      <View className='login__form'>
        <View className='login__input-group'>
          <Input
            className='login__input'
            type='number'
            maxlength={11}
            placeholder='请输入手机号'
            placeholderStyle='color: #64748b'
            value={phone}
            onInput={e => setPhone(e.detail.value)}
          />
        </View>
        <View className='login__input-group login__input-group--code'>
          <Input
            className='login__input login__input--code'
            type='number'
            maxlength={6}
            placeholder='请输入验证码'
            placeholderStyle='color: #64748b'
            value={code}
            onInput={e => setCode(e.detail.value)}
          />
          <View
            className={`login__code-btn ${countdown > 0 ? 'login__code-btn--disabled' : ''}`}
            onClick={handleSendCode}
          >
            <Text className='login__code-btn-text'>
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </Text>
          </View>
        </View>
        <Button
          className='login__submit-btn'
          onClick={handlePhoneLogin}
          disabled={loading}
        >
          登录
        </Button>
      </View>

      {/* 底部协议 */}
      <View className='login__footer'>
        <Text className='login__agreement'>
          登录即表示同意《用户协议》和《隐私政策》
        </Text>
      </View>
    </View>
  )
}
