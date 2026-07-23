'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMe, updateProfile, updatePrivacy, uploadAvatar, getUser } from '@/services/users'
import { getPosts } from '@/services/posts'
import { followUser, unfollowUser, getFollowStatus, getFollowers, getFollowing } from '@/services/follows'
import { getGalleryList } from '@/services/gallery'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { format } from 'date-fns'
import {
  User, Camera, Save, Heart, MessageCircle,
  Shield, Eye, EyeOff, Loader2, UserPlus, UserMinus,
  Users, Image as ImageIcon, Lock
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

/* 个人主页内容（需要 Suspense 包裹 useSearchParams） */
function ProfileContent() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const { user: authUser, isAuthenticated, setUser } = useAuthStore()

  /* 查看他人主页时通过 userId 参数 */
  const viewUserId = searchParams.get('userId') || ''
  const isViewingOther = !!viewUserId && viewUserId !== authUser?.id

  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState('')
  const [equipment, setEquipment] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [interestList, setInterestList] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingPrivacy, setEditingPrivacy] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'posts' | 'gallery' | 'followers' | 'following'>('posts')

  /* 隐私设置 */
  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [showEquipment, setShowEquipment] = useState(true)

  /* 当前用户信息 */
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: isAuthenticated && !isViewingOther,
  })

  /* 查看他人资料 */
  const { data: otherUser, isLoading: otherLoading } = useQuery({
    queryKey: ['user', viewUserId],
    queryFn: () => getUser(viewUserId),
    enabled: isViewingOther,
  })

  /* 关注状态 */
  const { data: followStatus } = useQuery({
    queryKey: ['followStatus', viewUserId],
    queryFn: () => getFollowStatus(viewUserId),
    enabled: isViewingOther,
  })

  /* 关注/取关 */
  const followMutation = useMutation({
    mutationFn: () => followUser(viewUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['followStatus', viewUserId] }),
  })
  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(viewUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['followStatus', viewUserId] }),
  })

  /* 帖子列表 */
  const { data: userPosts } = useQuery({
    queryKey: ['userPosts', viewUserId],
    queryFn: () => getPosts({ page: 1, pageSize: 10 }),
    enabled: activeTab === 'posts',
  })

  /* 画廊作品 */
  const { data: userGallery } = useQuery({
    queryKey: ['userGallery', viewUserId],
    queryFn: () => getGalleryList({ page: 1, pageSize: 10 }),
    enabled: activeTab === 'gallery',
  })

  /* 粉丝列表 */
  const { data: followersData } = useQuery({
    queryKey: ['followers', viewUserId],
    queryFn: () => getFollowers(viewUserId || authUser?.id || '', { page: 1, pageSize: 20 }),
    enabled: activeTab === 'followers',
  })

  /* 关注列表 */
  const { data: followingData } = useQuery({
    queryKey: ['following', viewUserId],
    queryFn: () => getFollowing(viewUserId || authUser?.id || '', { page: 1, pageSize: 20 }),
    enabled: activeTab === 'following',
  })

  const displayUser = isViewingOther ? otherUser : (me || authUser)
  const isPrivate = isViewingOther && !followStatus?.isFollowing && otherUser?.privacySettings

  /* 初始化表单 */
  useEffect(() => {
    if (me) {
      setNickname(me.nickname || '')
      setBio(me.bio || '')
      setEquipment(me.equipment || '')
      setInterestList(me.interests || [])
      if (me.privacySettings) {
        setShowEmail(me.privacySettings.showEmail)
        setShowPhone(me.privacySettings.showPhone)
        setShowEquipment(me.privacySettings.showEquipment)
      }
    }
  }, [me])

  /* 更新资料 */
  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage('')
    try {
      const updated = await updateProfile({
        nickname: nickname || undefined,
        bio: bio || undefined,
        interests: interestList.length > 0 ? interestList : undefined,
        equipment: equipment || undefined,
      })
      setUser(updated)
      setMessage('资料更新成功')
      setEditingProfile(false)
      queryClient.invalidateQueries({ queryKey: ['me'] })
    } catch {
      setMessage('更新失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  /* 更新隐私 */
  const handleSavePrivacy = async () => {
    setSaving(true)
    setMessage('')
    try {
      const updated = await updatePrivacy({ showEmail, showPhone, showEquipment })
      setUser(updated)
      setMessage('隐私设置更新成功')
      setEditingPrivacy(false)
    } catch {
      setMessage('更新失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  /* 上传头像 */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await uploadAvatar(file)
      if (me) setUser({ ...me, avatar: result.url })
      queryClient.invalidateQueries({ queryKey: ['me'] })
    } catch {
      setMessage('头像上传失败')
    }
  }

  /* 添加兴趣标签 */
  const addInterest = () => {
    const tag = interestInput.trim()
    if (tag && !interestList.includes(tag)) setInterestList([...interestList, tag])
    setInterestInput('')
  }

  if (!isAuthenticated && !isViewingOther) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex-1 px-4 py-20 text-center">
          <p className="text-star-dim">请先登录查看个人资料</p>
          <Button variant="primary" className="mt-4" onClick={() => (window.location.href = '/login')}>去登录</Button>
        </main>
        <Footer />
      </div>
    )
  }

  const loading = isViewingOther ? otherLoading : isLoading

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* 消息提示 */}
            {message && (
              <div className="mb-4 rounded-lg bg-neon-cyan/10 px-4 py-2 text-sm text-neon-cyan border border-neon-cyan/30">
                {message}
              </div>
            )}

            {/* 个人信息卡片 */}
            <Card glowColor="blue" className="mb-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                {/* 头像 */}
                <div className="relative group">
                  <Avatar src={displayUser?.avatar} alt={displayUser?.nickname || ''} size="lg" />
                  {!isViewingOther && (
                    <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-space-900/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 text-star-white" />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {/* 基本信息 */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-bold text-star-white">{displayUser?.nickname}</h2>
                  <p className="mt-1 text-sm text-star-dim">{displayUser?.bio || '暂无简介'}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <Badge variant="blue">
                      <Coins className="mr-1 h-3 w-3" /> {displayUser?.points || 0} 积分
                    </Badge>
                    <Badge variant="default">
                      <Users className="mr-1 h-3 w-3" /> {followStatus?.followersCount || 0} 粉丝
                    </Badge>
                    <Badge variant="default">
                      <Users className="mr-1 h-3 w-3" /> {followStatus?.followingCount || 0} 关注
                    </Badge>
                    {displayUser?.createdAt && (
                      <Badge variant="default">
                        加入于 {format(new Date(displayUser.createdAt), 'yyyy-MM-dd')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                {isViewingOther ? (
                  followStatus?.isFollowing ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => unfollowMutation.mutate()}
                      disabled={unfollowMutation.isPending}
                    >
                      {unfollowMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserMinus className="mr-1 h-4 w-4" />}
                      已关注
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                    >
                      {followMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />}
                      关注
                    </Button>
                  )
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setEditingProfile(!editingProfile)}>
                    <User className="mr-1 h-4 w-4" />
                    {editingProfile ? '取消编辑' : '编辑资料'}
                  </Button>
                )}
              </div>

              {/* 编辑资料表单（仅自己可见） */}
              {!isViewingOther && editingProfile && (
                <div className="mt-6 space-y-4 border-t border-space-600 pt-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm text-star-dim">昵称</label>
                    <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                      className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm text-star-dim">简介</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="介绍一下自己..."
                      className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 resize-none transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm text-star-dim">兴趣标签</label>
                    <div className="flex gap-2">
                      <input type="text" value={interestInput} onChange={(e) => setInterestInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterest() } }}
                        placeholder="输入兴趣后按回车"
                        className="flex-1 rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors" />
                    </div>
                    {interestList.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {interestList.map((tag) => (
                          <Badge key={tag} variant="cyan" className="cursor-pointer" onClick={() => setInterestList(interestList.filter((t) => t !== tag))}>
                            {tag} <span className="ml-1">×</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm text-star-dim">设备信息</label>
                    <input type="text" value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="如：信达EQ6R、ZWO ASI294MC Pro..."
                      className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors" />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      保存
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* 隐私提示 */}
            {isPrivate && (
              <Card glowColor="purple" className="mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-neon-purple" />
                  <div>
                    <p className="text-sm font-medium text-star-white">该用户设置了隐私保护</p>
                    <p className="text-xs text-star-dim">关注后可查看更多内容</p>
                  </div>
                </div>
              </Card>
            )}

            {/* 标签页 */}
            <div className="mb-4 flex gap-1 border-b border-space-600">
              {[
                { key: 'posts' as const, label: '帖子', icon: MessageCircle },
                { key: 'gallery' as const, label: '画廊作品', icon: ImageIcon },
                { key: 'followers' as const, label: '粉丝', icon: Users },
                { key: 'following' as const, label: '关注', icon: Users },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-neon-blue text-neon-blue'
                      : 'border-transparent text-star-dim hover:text-star-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 帖子列表 */}
            {activeTab === 'posts' && (
              <Card glowColor="cyan" className="mb-6">
                {userPosts?.items.length === 0 ? (
                  <p className="py-4 text-center text-sm text-star-dim">暂无帖子</p>
                ) : (
                  <div className="space-y-3">
                    {userPosts?.items.map((post) => (
                      <Link key={post.id} href={`/post/${post.id}`}>
                        <div className="rounded-lg border border-space-600 bg-space-700 p-3 hover:border-neon-cyan/30 transition-colors">
                          <h4 className="text-sm font-medium text-star-white">{post.title}</h4>
                          <div className="mt-1 flex items-center gap-3 text-xs text-star-dim">
                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likesCount}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.commentsCount}</span>
                            <span>{format(new Date(post.createdAt), 'yyyy-MM-dd')}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* 画廊作品 */}
            {activeTab === 'gallery' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userGallery?.items.length === 0 ? (
                  <p className="col-span-full py-4 text-center text-sm text-star-dim">暂无画廊作品</p>
                ) : (
                  userGallery?.items.map((item) => (
                    <Link key={item.id} href="/gallery">
                      <div className="overflow-hidden rounded-xl border border-space-600 bg-space-800 transition-all hover:border-neon-cyan/40">
                        <img src={item.imageUrl} alt={item.title} className="h-40 w-full object-cover" />
                        <div className="p-3">
                          <h4 className="text-sm font-medium text-star-white line-clamp-1">{item.title}</h4>
                          <div className="mt-1 flex items-center gap-2 text-xs text-star-dim">
                            <Heart className="h-3 w-3" /> {item.likesCount}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* 粉丝列表 */}
            {activeTab === 'followers' && (
              <Card glowColor="blue" className="mb-6">
                {followersData?.items.length === 0 ? (
                  <p className="py-4 text-center text-sm text-star-dim">暂无粉丝</p>
                ) : (
                  <div className="space-y-3">
                    {followersData?.items.map((f) => (
                      <Link key={f.id} href={`/profile?userId=${f.id}`}>
                        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-space-700 transition-colors">
                          <Avatar src={f.avatar} alt={f.nickname} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-star-white">{f.nickname}</p>
                            {f.bio && <p className="text-xs text-star-dim line-clamp-1">{f.bio}</p>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* 关注列表 */}
            {activeTab === 'following' && (
              <Card glowColor="blue" className="mb-6">
                {followingData?.items.length === 0 ? (
                  <p className="py-4 text-center text-sm text-star-dim">暂无关注</p>
                ) : (
                  <div className="space-y-3">
                    {followingData?.items.map((f) => (
                      <Link key={f.id} href={`/profile?userId=${f.id}`}>
                        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-space-700 transition-colors">
                          <Avatar src={f.avatar} alt={f.nickname} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-star-white">{f.nickname}</p>
                            {f.bio && <p className="text-xs text-star-dim line-clamp-1">{f.bio}</p>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* 隐私设置（仅自己可见） */}
            {!isViewingOther && (
              <Card glowColor="purple" className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-base font-medium text-star-white">
                    <Shield className="h-4 w-4 text-neon-purple" />
                    隐私设置
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setEditingPrivacy(!editingPrivacy)}>
                    {editingPrivacy ? '取消' : '编辑'}
                  </Button>
                </div>

                {editingPrivacy ? (
                  <div className="mt-4 space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-star-dim">公开邮箱</span>
                      <button onClick={() => setShowEmail(!showEmail)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${showEmail ? 'bg-neon-blue' : 'bg-space-600'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-star-white transition-transform ${showEmail ? 'left-5.5' : 'left-0.5'}`} />
                      </button>
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-star-dim">公开手机号</span>
                      <button onClick={() => setShowPhone(!showPhone)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${showPhone ? 'bg-neon-blue' : 'bg-space-600'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-star-white transition-transform ${showPhone ? 'left-5.5' : 'left-0.5'}`} />
                      </button>
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-star-dim">公开设备信息</span>
                      <button onClick={() => setShowEquipment(!showEquipment)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${showEquipment ? 'bg-neon-blue' : 'bg-space-600'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-star-white transition-transform ${showEquipment ? 'left-5.5' : 'left-0.5'}`} />
                      </button>
                    </label>
                    <div className="flex justify-end">
                      <Button onClick={handleSavePrivacy} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        保存
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 text-sm text-star-dim">
                    <p>公开邮箱：{showEmail ? '是' : '否'}</p>
                    <p>公开手机号：{showPhone ? '是' : '否'}</p>
                    <p>公开设备信息：{showEquipment ? '是' : '否'}</p>
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

/* 积分图标组件（内联） */
function Coins({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M9 9h6M9 15h6" />
    </svg>
  )
}

/* 个人主页（Suspense 包裹） */
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col"><div className="mx-auto flex-1 px-4 py-20"><Skeleton className="h-32 w-full" /><Skeleton className="mt-4 h-64 w-full" /></div></div>}>
      <ProfileContent />
    </Suspense>
  )
}
