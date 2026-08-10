import { useEffect, useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { followsApi } from '@/services/api'
import type { FollowUser } from '@/services/api'
import { isLoggedIn } from '@/stores/auth'
import './index.scss'

const PAGE_SIZE = 20

type TabType = 'following' | 'followers'

/** 关注/粉丝列表页 */
export default function Follow() {
  const router = useRouter()
  const userId = router.params.userId || ''

  const [tab, setTab] = useState<TabType>((router.params.type as TabType) === 'followers' ? 'followers' : 'following')
  const [users, setUsers] = useState<FollowUser[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  /** 粉丝页中，当前用户是否已关注某粉丝（key 为对方 userId） */
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({})

  /** 加载列表 */
  const loadList = async (tabType: TabType, pageNum: number, append = false) => {
    if (!userId || loading) return
    setLoading(true)
    try {
      const api = tabType === 'following' ? followsApi.getFollowing : followsApi.getFollowers
      const res = await api(userId, { page: pageNum, pageSize: PAGE_SIZE })
      const list = (res.data || [])
        .map(item => (tabType === 'following' ? item.following : item.follower))
        .filter((u): u is FollowUser => !!u)
      setUsers(append ? prev => [...prev, ...list] : list)
      setHasMore(list.length >= PAGE_SIZE)
      setPage(pageNum)
    } catch {
      // 错误已在 request 层处理
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setUsers([])
    setHasMore(true)
    setPage(1)
    setFollowMap({})
    loadList(tab, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  /** 切换 tab */
  const handleTabChange = (t: TabType) => {
    if (t === tab) return
    setTab(t)
  }

  /** 上拉加载更多 */
  const handleScrollToLower = () => {
    if (hasMore && !loading) {
      loadList(tab, page + 1, true)
    }
  }

  /** 未登录则跳转登录页 */
  const ensureLogin = (): boolean => {
    if (isLoggedIn()) return true
    Taro.navigateTo({ url: '/pages/login/index' })
    return false
  }

  /** 关注/取消关注（粉丝页） */
  const handleFollowToggle = async (u: FollowUser) => {
    if (!ensureLogin()) return
    const currently = !!followMap[u.id]
    try {
      if (currently) {
        await followsApi.unfollowUser(u.id)
        setFollowMap(prev => ({ ...prev, [u.id]: false }))
        Taro.showToast({ title: '已取消关注', icon: 'none' })
      } else {
        await followsApi.followUser(u.id)
        setFollowMap(prev => ({ ...prev, [u.id]: true }))
        Taro.showToast({ title: '关注成功', icon: 'success' })
      }
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 取消关注（关注列表页） */
  const handleUnfollow = async (u: FollowUser) => {
    if (!ensureLogin()) return
    try {
      await followsApi.unfollowUser(u.id)
      setUsers(prev => prev.filter(x => x.id !== u.id))
      Taro.showToast({ title: '已取消关注', icon: 'none' })
    } catch {
      // 错误已在 request 层处理
    }
  }

  return (
    <View className='follow'>
      {/* 顶部 Tab */}
      <View className='follow__tabs'>
        <View
          className={`follow__tab ${tab === 'following' ? 'follow__tab--active' : ''}`}
          onClick={() => handleTabChange('following')}
        >
          <Text className='follow__tab-text'>关注</Text>
        </View>
        <View
          className={`follow__tab ${tab === 'followers' ? 'follow__tab--active' : ''}`}
          onClick={() => handleTabChange('followers')}
        >
          <Text className='follow__tab-text'>粉丝</Text>
        </View>
      </View>

      {/* 用户列表 */}
      <ScrollView className='follow__list' scrollY onScrollToLower={handleScrollToLower}>
        {users.map(u => (
          <View key={u.id} className='follow__item'>
            {u.avatar ? (
              <Image className='follow__avatar' src={u.avatar} mode='aspectFill' />
            ) : (
              <View className='follow__avatar follow__avatar--placeholder'>
                <Text className='follow__avatar-text'>
                  {(u.nickname || u.username || '匿')[0]}
                </Text>
              </View>
            )}
            <View className='follow__info'>
              <Text className='follow__nickname'>{u.nickname || '太空猎人'}</Text>
              <Text className='follow__username'>@{u.username}</Text>
            </View>

            {tab === 'following' ? (
              <View className='follow__btn follow__btn--following' onClick={() => handleUnfollow(u)}>
                <Text className='follow__btn-text'>已关注</Text>
              </View>
            ) : (
              <View
                className={`follow__btn ${followMap[u.id] ? 'follow__btn--following' : 'follow__btn--normal'}`}
                onClick={() => handleFollowToggle(u)}
              >
                <Text className='follow__btn-text'>{followMap[u.id] ? '已关注' : '关注'}</Text>
              </View>
            )}
          </View>
        ))}

        {users.length === 0 && !loading && (
          <View className='follow__empty'>
            <Text className='follow__empty-text'>
              {tab === 'following' ? '暂无关注' : '暂无粉丝'}
            </Text>
          </View>
        )}

        {loading && (
          <View className='follow__loading'>
            <Text className='follow__loading-text'>加载中...</Text>
          </View>
        )}

        {!hasMore && users.length > 0 && (
          <View className='follow__no-more'>
            <Text className='follow__no-more-text'>没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
