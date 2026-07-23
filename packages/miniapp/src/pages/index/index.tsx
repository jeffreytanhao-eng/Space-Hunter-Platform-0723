import { useState, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import PostCard from '@/components/post-card'
import { postsApi } from '@/services/api'
import type { PostItem } from '@/services/api'
import './index.scss'

/** 板块标签 */
const CATEGORIES = [
  { key: '', label: '全部' },
  { key: 'observation', label: '观测' },
  { key: 'equipment', label: '器材' },
  { key: 'photography', label: '摄影' },
  { key: 'knowledge', label: '知识' },
  { key: 'chat', label: '闲聊' },
]

const PAGE_SIZE = 10

/** 首页 - 论坛列表 */
export default function Index() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  /** 加载帖子列表 */
  const loadPosts = useCallback(async (pageNum: number, cat: string, append = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await postsApi.getPosts({ page: pageNum, pageSize: PAGE_SIZE, category: cat })
      const list = res.list || []
      setPosts(append ? prev => [...prev, ...list] : list)
      setHasMore(list.length >= PAGE_SIZE)
      setPage(pageNum)
    } catch {
      // 错误已在 request 层处理
    } finally {
      setLoading(false)
    }
  }, [loading])

  /** 页面显示时加载数据 */
  useDidShow(() => {
    loadPosts(1, category)
  })

  /** 下拉刷新 */
  usePullDownRefresh(() => {
    loadPosts(1, category).finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  /** 切换板块 */
  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setPosts([])
    loadPosts(1, cat)
  }

  /** 上拉加载更多 */
  const handleScrollToLower = () => {
    if (hasMore && !loading) {
      loadPosts(page + 1, category, true)
    }
  }

  return (
    <View className='index'>
      {/* 板块切换标签 */}
      <ScrollView className='index__categories' scrollX enableFlex>
        {CATEGORIES.map(cat => (
          <View
            key={cat.key}
            className={`index__category ${category === cat.key ? 'index__category--active' : ''}`}
            onClick={() => handleCategoryChange(cat.key)}
          >
            <Text>{cat.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 帖子列表 */}
      <ScrollView
        className='index__list'
        scrollY
        onScrollToLower={handleScrollToLower}
      >
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}

        {posts.length === 0 && !loading && (
          <View className='index__empty'>
            <Text className='index__empty-text'>暂无帖子，快来发布第一篇吧</Text>
          </View>
        )}

        {loading && (
          <View className='index__loading'>
            <Text className='index__loading-text'>加载中...</Text>
          </View>
        )}

        {!hasMore && posts.length > 0 && (
          <View className='index__no-more'>
            <Text className='index__no-more-text'>没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
