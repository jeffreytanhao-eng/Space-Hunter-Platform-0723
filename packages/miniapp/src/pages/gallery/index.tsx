import { useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { galleryApi, favoritesApi } from '@/services/api'
import type { GalleryItem } from '@/services/api'
import { isLoggedIn } from '@/stores/auth'
import './index.scss'

/** 画廊分类 */
const GALLERY_CATEGORIES = [
  { key: '', label: '全部' },
  { key: 'nebula', label: '星云' },
  { key: 'galaxy', label: '星系' },
  { key: 'planet', label: '行星' },
  { key: 'landscape', label: '星空地景' },
  { key: 'deepsky', label: '深空' },
]

const PAGE_SIZE = 12

/** 荣耀画廊页 */
export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  /** 收藏状态表（key 为 gallery id） */
  const [favMap, setFavMap] = useState<Record<string, boolean>>({})

  /** 加载画廊列表 */
  const loadGallery = async (pageNum: number, cat: string, append = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await galleryApi.getGalleryList({ page: pageNum, pageSize: PAGE_SIZE, category: cat })
      const list = res.list || []
      setItems(append ? prev => [...prev, ...list] : list)
      setHasMore(list.length >= PAGE_SIZE)
      setPage(pageNum)
    } catch {
      // 错误已在 request 层处理
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    loadGallery(1, category)
  })

  usePullDownRefresh(() => {
    loadGallery(1, category).finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  /** 切换分类 */
  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setItems([])
    loadGallery(1, cat)
  }

  /** 上拉加载更多 */
  const handleScrollToLower = () => {
    if (hasMore && !loading) {
      loadGallery(page + 1, category, true)
    }
  }

  /** 预览大图 */
  const handlePreview = (item: GalleryItem) => {
    const urls = items.map(i => i.imageUrl)
    Taro.previewImage({
      urls,
      current: item.imageUrl,
    })
  }

  /** 收藏/取消收藏画廊作品 */
  const handleFavorite = async (item: GalleryItem) => {
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    const currently = !!favMap[item.id]
    try {
      if (currently) {
        await favoritesApi.remove('gallery', item.id)
        Taro.showToast({ title: '已取消收藏', icon: 'none' })
      } else {
        await favoritesApi.add({ targetType: 'gallery', targetId: item.id })
        Taro.showToast({ title: '收藏成功', icon: 'success' })
      }
      setFavMap(prev => ({ ...prev, [item.id]: !currently }))
    } catch {
      // 错误已在 request 层处理
    }
  }

  return (
    <View className='gallery'>
      {/* 分类筛选 */}
      <ScrollView className='gallery__categories' scrollX enableFlex>
        {GALLERY_CATEGORIES.map(cat => (
          <View
            key={cat.key}
            className={`gallery__category ${category === cat.key ? 'gallery__category--active' : ''}`}
            onClick={() => handleCategoryChange(cat.key)}
          >
            <Text>{cat.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 画廊网格 */}
      <ScrollView
        className='gallery__grid-scroll'
        scrollY
        onScrollToLower={handleScrollToLower}
      >
        <View className='gallery__grid'>
          {items.map(item => (
            <View key={item.id} className='gallery__item' onClick={() => handlePreview(item)}>
              <Image
                className='gallery__item-image'
                src={item.thumbnailUrl || item.imageUrl}
                mode='aspectFill'
              />
              <View className='gallery__item-overlay'>
                <Text className='gallery__item-title'>{item.title}</Text>
                <Text className='gallery__item-author'>
                  {item.author?.nickname || item.author?.username || '匿名'}
                </Text>
              </View>
              <View
                className='gallery__fav-btn'
                onClick={(e) => { e.stopPropagation(); handleFavorite(item) }}
              >
                <Text className={`gallery__fav-icon ${favMap[item.id] ? 'gallery__fav-icon--active' : ''}`}>
                  {favMap[item.id] ? '⭐' : '☆'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {items.length === 0 && !loading && (
          <View className='gallery__empty'>
            <Text className='gallery__empty-text'>暂无作品</Text>
          </View>
        )}

        {loading && (
          <View className='gallery__loading'>
            <Text className='gallery__loading-text'>加载中...</Text>
          </View>
        )}

        {!hasMore && items.length > 0 && (
          <View className='gallery__no-more'>
            <Text className='gallery__no-more-text'>没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
