import { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Picker, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { sectionsApi, uploadApi, postsApi } from '@/services/api'
import type { SectionItem, PostImage } from '@/services/api'
import './index.scss'

const MAX_IMAGES = 9

/** 发帖页 */
export default function PostCreate() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sections, setSections] = useState<SectionItem[]>([])
  const [sectionIndex, setSectionIndex] = useState(-1)
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  /** 加载板块列表 */
  const loadSections = async () => {
    try {
      const list = await sectionsApi.getSections()
      setSections(list || [])
    } catch {
      // 错误已在 request 层处理
    }
  }

  useEffect(() => {
    loadSections()
  }, [])

  /** 选择图片 */
  const handleChooseImage = () => {
    const count = MAX_IMAGES - images.length
    if (count <= 0) return
    Taro.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        setImages(prev => [...prev, ...res.tempFilePaths].slice(0, MAX_IMAGES))
      },
    })
  }

  /** 删除图片 */
  const handleRemoveImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  /** 提交 */
  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle) {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (sectionIndex < 0) {
      Taro.showToast({ title: '请选择板块', icon: 'none' })
      return
    }
    if (!trimmedContent) {
      Taro.showToast({ title: '请输入正文', icon: 'none' })
      return
    }

    setSubmitting(true)
    Taro.showLoading({ title: '发布中...', mask: true })

    try {
      // 1. 逐张上传图片
      const uploaded: PostImage[] = []
      for (const filePath of images) {
        const res = await uploadApi.uploadImage(filePath)
        uploaded.push({ url: res.url, type: 'image' })
      }

      // 2. 创建帖子（同步主库）
      const section = sections[sectionIndex]
      await postsApi.createPost({
        title: trimmedTitle,
        content: trimmedContent,
        sectionId: section.id,
        images: uploaded.length > 0 ? uploaded : undefined,
      })

      Taro.hideLoading()
      Taro.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1200)
    } catch {
      Taro.hideLoading()
      // 错误已在 request / upload 层提示
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='post-create'>
      <ScrollView className='post-create__scroll' scrollY>
        {/* 标题 */}
        <View className='post-create__field'>
          <Text className='post-create__label'>标题</Text>
          <Input
            className='post-create__input'
            placeholder='请输入标题'
            placeholderStyle='color: #64748b'
            value={title}
            onInput={e => setTitle(e.detail.value)}
            maxlength={200}
          />
        </View>

        {/* 板块选择 */}
        <View className='post-create__field'>
          <Text className='post-create__label'>板块</Text>
          <Picker
            mode='selector'
            range={sections.map(s => s.name)}
            onChange={e => setSectionIndex(Number(e.detail.value))}
          >
            <View className='post-create__picker'>
              <Text className={sectionIndex < 0 ? 'post-create__picker-text--placeholder' : 'post-create__picker-text'}>
                {sectionIndex >= 0 ? sections[sectionIndex].name : '请选择板块'}
              </Text>
              <Text className='post-create__picker-arrow'>›</Text>
            </View>
          </Picker>
        </View>

        {/* 正文 */}
        <View className='post-create__field'>
          <Text className='post-create__label'>正文</Text>
          <Textarea
            className='post-create__textarea'
            placeholder='分享你的天文观测、摄影与心得...'
            placeholderStyle='color: #64748b'
            value={content}
            onInput={e => setContent(e.detail.value)}
            maxlength={5000}
            autoHeight
          />
        </View>

        {/* 图片选择 */}
        <View className='post-create__field'>
          <Text className='post-create__label'>图片（{images.length}/{MAX_IMAGES}）</Text>
          <View className='post-create__images'>
            {images.map((src, idx) => (
              <View key={idx} className='post-create__image-item'>
                <Image className='post-create__image' src={src} mode='aspectFill' />
                <View className='post-create__image-remove' onClick={() => handleRemoveImage(idx)}>
                  <Text className='post-create__image-remove-text'>×</Text>
                </View>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <View className='post-create__image-add' onClick={handleChooseImage}>
                <Text className='post-create__image-add-icon'>+</Text>
              </View>
            )}
          </View>
        </View>

        {/* 提交按钮 */}
        <View
          className={`post-create__submit ${submitting ? 'post-create__submit--disabled' : ''}`}
          onClick={handleSubmit}
        >
          <Text className='post-create__submit-text'>发布</Text>
        </View>
      </ScrollView>
    </View>
  )
}
