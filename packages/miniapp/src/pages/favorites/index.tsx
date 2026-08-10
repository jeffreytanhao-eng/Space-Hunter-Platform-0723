import { useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { favoritesApi } from '@/services/api'
import type { FavoriteItem } from '@/services/api'
import { isLoggedIn } from '@/stores/auth'
import './index.scss'

const PAGE_SIZE = 20

/** 收藏类型 Tab */
const TABS: { key: '' | 'post' | 'gallery'; label: string }[] = [
  { key: '', label: '全部' },
  { key: 'post', label: '帖子' },
  { key: 'gallery', label: '画廊' },
]

/** 我的收藏页 */
export default function Favorites() {
  const [tab, setTab] = useState<'' | 'post' | 'gallery'>('')
  const [list, setList] = useState<FavoriteItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  /** 加载收藏列表 */
  const loadFavorites = async (tabType: '' | 'post' | 'gallery', pageNum: number, append = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await favoritesApi.getFavorites({
        targetType: tabType || undefined,
        page: pageNum,
        pageSize: PAGE_SIZE,
      })
      const data = res.data || []
      setList(append ? prev => [...prev, ...data] : data)
      setHasMore(data.length >= PAGE_SIZE)
      setPage(pageNum)
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
    setList([])
    setHasMore(true)
    loadFavorites(tab, 1)
  })

  /** 切换 tab */
  const handleTabChange = (t: '' | 'post' | 'gallery') => {
    if (t === tab) return
    setTab(t)
    setList([])
    setHasMore(true)
    loadFavorites(t, 1)
  }

  /** 上拉加载更多 */
  const handleScrollToLower = () => {
    if (hasMore && !loading) {
      loadFavorites(tab, page + 1, true)
    }
  }

  /** 跳转目标详情 */
  const handleItemTap = (item: FavoriteItem) => {
    if (item.targetType === 'post') {
      Taro.navigateTo({ url: `/pages/post-detail/index?id=${item.targetId}` })
    } else {
      Taro.previewImage({ urls: [item.target?.imageUrl || ''].filter(Boolean) })
    }
  }

  /** 取消收藏 */
  const handleUnfavorite = async (item: FavoriteItem) => {
    try {
      await favoritesApi.remove(item.targetType, item.targetId)
      setList(prev => prev.filter(x => x.id !== item.id))
      Taro.showToast({ title: '已取消收藏', icon: 'none' })
    } catch {
      // 错误已在 request 层处理
    }
  }

  return (
    <View className='favorites'>
      {/* 类型 Tab */}
      <View className='favorites__tabs'>
        {TABS.map(t => (
          <View
            key={t.key}
            className={`favorites__tab ${tab === t.key ? 'favorites__tab--active' : ''}`}
            onClick={() => handleTabChange(t.key)}
          >
            <Text className='favorites__tab-text'>{t.label}</Text>
          </View>
        ))}
      </View>

      {/* 收藏列表 */}
      <ScrollView className='favorites__list' scrollY onScrollToLower={handleScrollToLower}>
        {list.map(item => (
          <View key={item.id} className='favorites__item' onClick={() => handleItemTap(item)}>
            {item.targetType === 'gallery' && item.target?.imageUrl ? (
              <Image className='favorites__cover' src={item.target.imageUrl} mode='aspectFill' />
            ) : item.target?.coverUrl ? (
              <Image className='favorites__cover' src={item.target.coverUrl} mode='aspectFill' />
            ) : (
              <View className='favorites__cover favorites__cover--placeholder'>
                <Text className='favorites__cover-text'>
                  {item.targetType === 'post' ? '帖' : '图'}
                </Text>
              </View>
            )}
            <View className='favorites__info'>
              <Text className='favorites__title'>{(item.target as any)?.title || '收藏内容'}</Text>
              <Text className='favorites__meta'>
                {item.targetType === 'post' ? '帖子' : '画廊作品'} · {item.target?.author?.nickname || item.target?.author?.username || '匿名'}
              </Text>
            </View>
            <View className='favorites__del-btn' onClick={(e) => { e.stopPropagation(); handleUnfavorite(item) }}>
              <Text className='favorites__del-btn-text'>取消</Text>
            </View>
          </View>
        ))}

        {list.length === 0 && !loading && (
          <View className='favorites__empty'>
            <Text className='favorites__empty-text'>暂无收藏</Text>
          </View>
        )}

        {loading && (
          <View className='favorites__loading'>
            <Text className='favorites__loading-text'>加载中...</Text>
          </View>
        )}

        {!hasMore && list.length > 0 && (
          <View className='favorites__no-more'>
            <Text className='favorites__no-more-text'>没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
