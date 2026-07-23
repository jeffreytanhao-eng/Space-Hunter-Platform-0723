import { useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { usersApi, postsApi } from '@/services/api'
import { getUser, isLoggedIn, logout } from '@/stores/auth'
import type { AuthUser, PostItem } from '@/services/api'
import './index.scss'

/** 个人中心页 */
export default function Profile() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [myPosts, setMyPosts] = useState<PostItem[]>([])
  const [_loading, setLoading] = useState(false)

  /** 加载用户信息 */
  const loadUser = async () => {
    try {
      const data = await usersApi.getMe()
      setUser(data)
    } catch {
      // 尝试从本地缓存恢复
      const cached = getUser()
      if (cached) setUser(cached)
    }
  }

  /** 加载我的帖子 */
  const loadMyPosts = async () => {
    try {
      setLoading(true)
      const res = await postsApi.getPosts({ page: 1, pageSize: 10 })
      // 过滤当前用户的帖子
      setMyPosts(res.list || [])
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
    loadUser()
    loadMyPosts()
  })

  /** 跳转编辑资料 */
  const handleEditProfile = () => {
    Taro.showToast({ title: '编辑资料功能开发中', icon: 'none' })
  }

  /** 跳转帖子详情 */
  const handlePostTap = (id: string) => {
    Taro.navigateTo({ url: `/pages/post-detail/index?id=${id}` })
  }

  /** 退出登录 */
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
        }
      },
    })
  }

  return (
    <View className='profile'>
      <ScrollView className='profile__scroll' scrollY>
        {/* 用户信息卡片 */}
        <View className='profile__header'>
          <View className='profile__avatar-area'>
            {user?.avatar ? (
              <Image className='profile__avatar' src={user.avatar} mode='aspectFill' />
            ) : (
              <View className='profile__avatar-placeholder'>
                <Text className='profile__avatar-text'>
                  {(user?.nickname || user?.username || '?')[0]}
                </Text>
              </View>
            )}
          </View>
          <View className='profile__info'>
            <Text className='profile__nickname'>{user?.nickname || user?.username || '未登录'}</Text>
            {user?.bio && <Text className='profile__bio'>{user.bio}</Text>}
          </View>
          <View className='profile__edit-btn' onClick={handleEditProfile}>
            <Text className='profile__edit-btn-text'>编辑</Text>
          </View>
        </View>

        {/* 数据统计 */}
        <View className='profile__stats'>
          <View className='profile__stat-item'>
            <Text className='profile__stat-value'>{user?.postCount || 0}</Text>
            <Text className='profile__stat-label'>帖子</Text>
          </View>
          <View className='profile__stat-item'>
            <Text className='profile__stat-value'>{user?.followCount || 0}</Text>
            <Text className='profile__stat-label'>关注</Text>
          </View>
          <View className='profile__stat-item'>
            <Text className='profile__stat-value'>{user?.followerCount || 0}</Text>
            <Text className='profile__stat-label'>粉丝</Text>
          </View>
          <View className='profile__stat-item'>
            <Text className='profile__stat-value'>{user?.points || 0}</Text>
            <Text className='profile__stat-label'>积分</Text>
          </View>
        </View>

        {/* 我的帖子 */}
        <View className='profile__section'>
          <Text className='profile__section-title'>我的帖子</Text>
          {myPosts.length > 0 ? (
            myPosts.map(post => (
              <View key={post.id} className='profile__post-item' onClick={() => handlePostTap(post.id)}>
                <View className='profile__post-info'>
                  <Text className='profile__post-title'>{post.title}</Text>
                  <Text className='profile__post-meta'>
                    👍 {post.likeCount} · 💬 {post.commentCount}
                  </Text>
                </View>
                {post.coverUrl && (
                  <Image className='profile__post-cover' src={post.coverUrl} mode='aspectFill' />
                )}
              </View>
            ))
          ) : (
            <View className='profile__empty'>
              <Text className='profile__empty-text'>暂无帖子</Text>
            </View>
          )}
        </View>

        {/* 功能入口 */}
        <View className='profile__section'>
          <View className='profile__menu-item' onClick={() => Taro.switchTab({ url: '/pages/points/index' })}>
            <Text className='profile__menu-text'>积分中心</Text>
            <Text className='profile__menu-arrow'>›</Text>
          </View>
          <View className='profile__menu-item' onClick={() => Taro.switchTab({ url: '/pages/gallery/index' })}>
            <Text className='profile__menu-text'>荣耀画廊</Text>
            <Text className='profile__menu-arrow'>›</Text>
          </View>
          <View className='profile__menu-item' onClick={() => Taro.switchTab({ url: '/pages/events/index' })}>
            <Text className='profile__menu-text'>活动中心</Text>
            <Text className='profile__menu-arrow'>›</Text>
          </View>
        </View>

        {/* 退出登录 */}
        <View className='profile__logout' onClick={handleLogout}>
          <Text className='profile__logout-text'>退出登录</Text>
        </View>
      </ScrollView>
    </View>
  )
}
