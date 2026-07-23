import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { PostItem } from '@/services/api'
import './index.scss'

interface PostCardProps {
  post: PostItem
}

/** 帖子卡片组件 */
export default function PostCard(props: PostCardProps) {
  const { post } = props

  /** 点击跳转帖子详情 */
  const handleTap = () => {
    Taro.navigateTo({ url: `/pages/post-detail/index?id=${post.id}` })
  }

  /** 格式化时间 */
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}天前`
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <View className='post-card' onClick={handleTap}>
      <View className='post-card__main'>
        <View className='post-card__content-area'>
          <Text className='post-card__title'>{post.title}</Text>
          <Text className='post-card__excerpt'>{post.content}</Text>
          <View className='post-card__footer'>
            <Text className='post-card__author'>{post.author?.nickname || post.author?.username || '匿名'}</Text>
            <Text className='post-card__time'>{formatTime(post.createdAt)}</Text>
            <View className='post-card__stats'>
              <Text className='post-card__stat'>👍 {post.likeCount}</Text>
              <Text className='post-card__stat'>💬 {post.commentCount}</Text>
            </View>
          </View>
        </View>
        {post.coverUrl && (
          <Image className='post-card__cover' src={post.coverUrl} mode='aspectFill' />
        )}
      </View>
    </View>
  )
}
