import { useEffect, useState } from 'react'
import { View, Text, Image, Input, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { postsApi, followsApi, favoritesApi, messagesApi } from '@/services/api'
import type { PostDetail as PostDetailType, CommentItem } from '@/services/api'
import { isLoggedIn } from '@/stores/auth'
import './index.scss'

/** 帖子详情页 */
export default function PostDetail() {
  const router = useRouter()
  const [post, setPost] = useState<PostDetailType | null>(null)
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [favoriting, setFavoriting] = useState(false)

  /** 加载帖子详情 */
  const loadPost = async () => {
    const id = router.params.id
    if (!id) return
    try {
      setLoading(true)
      const data = await postsApi.getPost(id)
      setPost(data)
    } catch {
      // 错误已在 request 层处理
    } finally {
      setLoading(false)
    }
  }

  // 首次加载
  if (loading && !post) {
    loadPost()
  }

  // 帖子加载后查询关注状态
  useEffect(() => {
    if (!post?.author?.id || !isLoggedIn()) return
    followsApi.getFollowStatus(post.author.id)
      .then(res => setIsFollowing(res.following))
      .catch(() => {})
  }, [post?.author?.id])

  /** 关注/取消关注作者 */
  const handleFollowAuthor = async () => {
    if (!post?.author?.id) return
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      if (isFollowing) {
        await followsApi.unfollowUser(post.author.id)
        setIsFollowing(false)
        Taro.showToast({ title: '已取消关注', icon: 'none' })
      } else {
        await followsApi.followUser(post.author.id)
        setIsFollowing(true)
        Taro.showToast({ title: '关注成功', icon: 'success' })
      }
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 点赞 */
  const handleLike = async () => {
    if (!post) return
    try {
      await postsApi.likePost(post.id)
      setPost(prev => prev ? { ...prev, isLiked: !prev.isLiked, likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1 } : prev)
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 收藏/取消收藏 */
  const handleFavorite = async () => {
    if (!post) return
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    if (favoriting) return
    setFavoriting(true)
    try {
      const isFav = !!post.isFavorited
      if (isFav) {
        await favoritesApi.remove('post', post.id)
        Taro.showToast({ title: '已取消收藏', icon: 'none' })
      } else {
        await favoritesApi.add({ targetType: 'post', targetId: post.id })
        Taro.showToast({ title: '收藏成功', icon: 'success' })
      }
      setPost(prev => prev ? { ...prev, isFavorited: !isFav, favoriteCount: (prev.favoriteCount || 0) + (isFav ? -1 : 1) } : prev)
    } catch {
      // 错误已在 request 层处理
    } finally {
      setFavoriting(false)
    }
  }

  /** 私信作者 */
  const handleMessageAuthor = async () => {
    if (!post?.author?.id) return
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      const conv = await messagesApi.createConversation(post.author.id)
      Taro.navigateTo({ url: `/pages/messages/chat?id=${conv.id}` })
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 发送评论 */
  const handleSendComment = async () => {
    if (!post || !commentText.trim()) return
    try {
      await postsApi.commentPost(post.id, commentText.trim())
      setCommentText('')
      Taro.showToast({ title: '评论成功', icon: 'success' })
      loadPost()
    } catch {
      // 错误已在 request 层处理
    }
  }

  /** 预览图片 */
  const handlePreviewImage = (urls: string[], current: string) => {
    Taro.previewImage({ urls, current })
  }

  /** 格式化时间 */
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (!post) {
    return (
      <View className='post-detail'>
        <View className='post-detail__loading'>
          <Text className='post-detail__loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='post-detail'>
      <ScrollView className='post-detail__scroll' scrollY>
        {/* 帖子头部 */}
        <View className='post-detail__header'>
          <View className='post-detail__author-info'>
            {post.author?.avatar ? (
              <Image className='post-detail__avatar' src={post.author.avatar} mode='aspectFill' />
            ) : (
              <View className='post-detail__avatar-placeholder'>
                <Text className='post-detail__avatar-text'>
                  {(post.author?.nickname || post.author?.username || '匿')[0]}
                </Text>
              </View>
            )}
            <View className='post-detail__author-meta'>
              <Text className='post-detail__author-name'>
                {post.author?.nickname || post.author?.username || '匿名'}
              </Text>
              <Text className='post-detail__time'>{formatTime(post.createdAt)}</Text>
            </View>
            <View
              className={`post-detail__follow-btn ${isFollowing ? 'post-detail__follow-btn--following' : ''}`}
              onClick={handleFollowAuthor}
            >
              <Text className='post-detail__follow-btn-text'>{isFollowing ? '已关注' : '关注'}</Text>
            </View>
            <View className='post-detail__msg-btn' onClick={handleMessageAuthor}>
              <Text className='post-detail__msg-btn-text'>私信</Text>
            </View>
          </View>
          <Text className='post-detail__category'>{post.category}</Text>
        </View>

        {/* 帖子标题 */}
        <Text className='post-detail__title'>{post.title}</Text>

        {/* 帖子正文 */}
        <Text className='post-detail__body'>{post.content}</Text>

        {/* 帖子图片 */}
        {post.images && post.images.length > 0 && (
          <View className='post-detail__images'>
            {post.images.map((img, idx) => (
              <Image
                key={idx}
                className='post-detail__image'
                src={img}
                mode='aspectFill'
                onClick={() => handlePreviewImage(post.images!, img)}
              />
            ))}
          </View>
        )}

        {/* 互动栏 */}
        <View className='post-detail__actions'>
          <View className='post-detail__action' onClick={handleLike}>
            <Text className={`post-detail__action-icon ${post.isLiked ? 'post-detail__action-icon--liked' : ''}`}>
              {post.isLiked ? '❤️' : '🤍'}
            </Text>
            <Text className='post-detail__action-text'>{post.likeCount}</Text>
          </View>
          <View className='post-detail__action'>
            <Text className='post-detail__action-icon'>💬</Text>
            <Text className='post-detail__action-text'>{post.commentCount}</Text>
          </View>
          <View className='post-detail__action' onClick={handleFavorite}>
            <Text className={`post-detail__action-icon ${post.isFavorited ? 'post-detail__action-icon--favorited' : ''}`}>
              {post.isFavorited ? '⭐' : '☆'}
            </Text>
            <Text className='post-detail__action-text'>{post.favoriteCount || 0}</Text>
          </View>
        </View>

        {/* 评论列表 */}
        <View className='post-detail__comments'>
          <Text className='post-detail__comments-title'>评论 ({post.comments?.length || 0})</Text>
          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment: CommentItem) => (
              <View key={comment.id} className='post-detail__comment'>
                <View className='post-detail__comment-avatar'>
                  <Text className='post-detail__comment-avatar-text'>
                    {(comment.author?.nickname || comment.author?.username || '匿')[0]}
                  </Text>
                </View>
                <View className='post-detail__comment-body'>
                  <View className='post-detail__comment-header'>
                    <Text className='post-detail__comment-author'>
                      {comment.author?.nickname || comment.author?.username || '匿名'}
                    </Text>
                    <Text className='post-detail__comment-time'>{formatTime(comment.createdAt)}</Text>
                  </View>
                  <Text className='post-detail__comment-content'>{comment.content}</Text>
                </View>
              </View>
            ))
          ) : (
            <View className='post-detail__no-comments'>
              <Text className='post-detail__no-comments-text'>暂无评论，快来发表你的看法</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部评论输入框 */}
      <View className='post-detail__input-bar'>
        <Input
          className='post-detail__input'
          placeholder='写评论...'
          placeholderStyle='color: #64748b'
          value={commentText}
          onInput={e => setCommentText(e.detail.value)}
          confirmType='send'
          onConfirm={handleSendComment}
        />
        <View className='post-detail__send-btn' onClick={handleSendComment}>
          <Text className='post-detail__send-btn-text'>发送</Text>
        </View>
      </View>
    </View>
  )
}
