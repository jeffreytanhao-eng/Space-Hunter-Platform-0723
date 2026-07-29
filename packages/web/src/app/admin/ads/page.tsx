'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus, Pencil, Trash2, RefreshCw, MapPin, X, Eye, EyeOff, ExternalLink, Image as ImageIcon, Upload, Loader2, Search,
} from 'lucide-react'
import { hasMap, type AdItem } from '@/lib/ads'
import { MAX_ADS, getAllAds, createAd, updateAd as apiUpdateAd, deleteAd as apiDeleteAd, resetAds as apiResetAds, type AdFormData } from '@/services/ads'
import { AddressPicker, type AddressSelectResult } from '@/components/admin/address-picker'
import apiClient from '@/lib/api'

/* 广告管理页面 */
export default function AdsManagePage() {
  const [ads, setAds] = useState<AdItem[]>([])
  const [editing, setEditing] = useState<AdItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllAds()
      setAds(data.sort((a, b) => a.sortOrder - b.sortOrder))
    } catch (err) {
      console.error('加载广告失败:', err)
      setAds([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleSave = async (data: AdFormData) => {
    setSaving(true)
    try {
      if (editing) {
        await apiUpdateAd(editing.id, data)
      } else {
        await createAd(data)
      }
      setShowForm(false)
      setEditing(null)
      await refresh()
    } catch (err) {
      console.error('保存广告失败:', err)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (ad: AdItem) => {
    try {
      await apiUpdateAd(ad.id, { active: !ad.active })
      await refresh()
    } catch (err) {
      console.error('切换状态失败:', err)
    }
  }

  const handleDelete = async (ad: AdItem) => {
    if (confirm(`确定要删除广告「${ad.title}」吗？`)) {
      try {
        await apiDeleteAd(ad.id)
        await refresh()
      } catch (err) {
        console.error('删除广告失败:', err)
        alert('删除失败，请重试')
      }
    }
  }

  const handleReset = async () => {
    if (confirm('确定要重置为默认广告吗？所有自定义广告将被清除。')) {
      try {
        await apiResetAds()
        await refresh()
      } catch (err) {
        console.error('重置失败:', err)
        alert('重置失败，请重试')
      }
    }
  }

  const activeCount = ads.filter((a) => a.active).length

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-star-white">广告管理</h1>
          <p className="mt-1 text-sm text-star-dim">
            首页最多展示 {MAX_ADS} 个广告 · 当前 {ads.length} 条（启用 {activeCount} 条）
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            重置默认
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setEditing(null); setShowForm(true) }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            新增广告
          </Button>
        </div>
      </div>

      {/* 广告列表 */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <Card><p className="text-center text-sm text-star-dim">加载中...</p></Card>
        ) : ads.length === 0 ? (
          <Card><p className="text-center text-sm text-star-dim">暂无广告，点击右上角新增</p></Card>
        ) : (
          ads.map((ad) => (
            <Card key={ad.id} className="flex items-center gap-4">
              {/* 缩略图 */}
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-space-900">
                {ad.img ? (
                  <img src={ad.img} alt={ad.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-star-dim/40" />
                  </div>
                )}
              </div>

              {/* 信息 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-medium text-star-white">{ad.title}</span>
                  {hasMap(ad) && <MapPin className="h-3.5 w-3.5 shrink-0 text-neon-cyan" />}
                  {ad.href && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-neon-purple" />}
                  {!ad.active && <span className="rounded bg-space-600 px-1.5 py-0.5 text-xs text-star-dim">已停用</span>}
                </div>
                <p className="mt-0.5 truncate text-xs text-star-dim">{ad.desc}</p>
                {ad.address && (
                  <p className="mt-0.5 truncate text-xs text-star-dim/70">📍 {ad.address}</p>
                )}
              </div>

              {/* 操作 */}
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleToggle(ad)} title={ad.active ? '停用' : '启用'}>
                  {ad.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(ad); setShowForm(true) }} title="编辑">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(ad)} title="删除">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 说明卡片 */}
      <Card className="mt-4">
        <h3 className="text-sm font-medium text-star-white">使用说明</h3>
        <ul className="mt-2 space-y-1 text-xs text-star-dim">
          <li>· <span className="text-neon-cyan">图片上传</span>：从本地电脑选择图片上传，自动裁剪以适应 4:3 卡片（保持长宽比）</li>
          <li>· <span className="text-neon-cyan">地址信息</span>（可选）：点击「地图选点」在高德地图弹窗中搜索选择地址，或手动输入</li>
          <li>· <span className="text-neon-purple">网络链接</span>（可选）：填写后点击广告图片跳转到指定链接</li>
          <li>· 首页最多展示 {MAX_ADS} 个广告（按排序权重取前 {MAX_ADS} 个启用的广告）</li>
        </ul>
      </Card>

      {/* 新增/编辑表单 */}
      {showForm && (
        <AdFormModal
          ad={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

/* ───── 广告表单 ───── */

function AdFormModal({
  ad,
  onClose,
  onSave,
}: {
  ad: AdItem | null
  onClose: () => void
  onSave: (data: AdFormData) => void
}) {
  const [title, setTitle] = useState(ad?.title || '')
  const [desc, setDesc] = useState(ad?.desc || '')
  const [img, setImg] = useState(ad?.img || '')
  const [href, setHref] = useState(ad?.href || '')
  const [address, setAddress] = useState(ad?.address || '')
  const [lng, setLng] = useState<number | undefined>(ad?.lng ?? undefined)
  const [lat, setLat] = useState<number | undefined>(ad?.lat ?? undefined)
  const [active, setActive] = useState(ad?.active ?? true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* 上传图片到后端 /upload */
  const handleUpload = async (file: File) => {
    // 校验文件类型
    if (!file.type.startsWith('image/')) {
      setUploadError('请选择图片文件（jpg/png/webp/gif）')
      return
    }
    // 校验文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('图片大小不能超过 10MB')
      return
    }

    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data: uploadRes } = await apiClient.post<{ type: string; url: string }>(
        '/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      setImg(uploadRes.url)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '上传失败'
      setUploadError(typeof msg === 'string' ? msg : '上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // 重置 input 以便重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  /* 从地图选择器回填地址 + 坐标 */
  const handleAddressSelect = (result: AddressSelectResult) => {
    setAddress(result.address)
    setLng(result.lng)
    setLat(result.lat)
  }

  /* 手动清空地址时同步清除坐标 */
  const handleAddressChange = (val: string) => {
    setAddress(val)
    if (!val.trim()) {
      setLng(undefined)
      setLat(undefined)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('请填写标题')
      return
    }
    if (!img.trim()) {
      alert('请上传图片')
      return
    }

    const data: AdFormData = {
      title: title.trim(),
      desc: desc.trim(),
      img: img.trim(),
      active,
    }

    // 链接（可选）
    if (href.trim()) {
      data.href = href.trim()
    }

    // 地址信息（可选，仅需填写地址文字；若有坐标则一并保存）
    if (address.trim()) {
      data.address = address.trim()
      if (lng != null) data.lng = lng
      if (lat != null) data.lat = lat
    }

    onSave(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-space-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-star-white">{ad ? '编辑广告' : '新增广告'}</h2>
          <button onClick={onClose} className="text-star-dim hover:text-star-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 标题 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-star-white">
              标题 <span className="text-red-400">*</span>
            </label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="如：青海冷湖暗夜星空保护区"
              className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/50 focus:border-neon-blue focus:outline-none"
            />
          </div>

          {/* 简要介绍 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-star-white">简要介绍 <span className="text-red-400">*</span></label>
            <input
              type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="如：东方天文圣地 · 光污染等级1级"
              className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/50 focus:border-neon-blue focus:outline-none"
            />
          </div>

          {/* 图片上传（本地文件） */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-star-white">
              广告图片 <span className="text-red-400">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* 上传区域 */}
            {!img && (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-space-600 bg-space-700/50 transition-colors hover:border-neon-blue hover:bg-space-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-neon-blue" />
                    <p className="mt-2 text-xs text-star-dim">正在上传...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-star-dim" />
                    <p className="mt-2 text-xs text-star-dim">点击或拖拽图片到此处上传</p>
                    <p className="mt-0.5 text-xs text-star-dim/50">支持 jpg/png/webp/gif，最大 10MB</p>
                  </>
                )}
              </div>
            )}

            {/* 已上传预览 */}
            {img && (
              <div className="space-y-2">
                <div className="relative h-32 w-44 overflow-hidden rounded-lg bg-space-900">
                  <img src={img} alt="预览" className="h-full w-full object-cover" />
                  {/* 重新上传按钮 */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100"
                  >
                    <span className="rounded-lg bg-space-800/90 px-3 py-1.5 text-xs text-star-white">
                      {uploading ? '上传中...' : '重新上传'}
                    </span>
                  </button>
                </div>
                {uploading && (
                  <p className="flex items-center gap-1 text-xs text-neon-blue">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    正在重新上传...
                  </p>
                )}
              </div>
            )}

            {uploadError && (
              <p className="mt-1 text-xs text-red-400">{uploadError}</p>
            )}
            <p className="mt-1 text-xs text-star-dim/60">图片将自动裁剪以适应 4:3 卡片（保持长宽比）</p>
          </div>

          {/* 网络链接（可选） */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-star-white">
              网络链接 <span className="text-star-dim/50 text-xs">（可选）</span>
            </label>
            <input
              type="url" value={href} onChange={(e) => setHref(e.target.value)}
              placeholder="https://example.com（点击图片跳转）"
              className="w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/50 focus:border-neon-blue focus:outline-none"
            />
          </div>

          {/* 地址信息（可选） */}
          <div className="rounded-lg border border-space-600 p-3">
            <p className="mb-2 text-sm font-medium text-star-white">
              地址信息 <span className="text-star-dim/50 text-xs">（可选，填写后显示地图按钮）</span>
            </p>
            <div>
              <label className="mb-1 block text-xs text-star-dim">地址</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="如：青海省海西州茫崖市冷湖镇"
                  className="flex-1 rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/50 focus:border-neon-blue focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAddressPicker(true)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-neon-cyan/10 px-3 py-2 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20"
                >
                  <Search className="h-4 w-4" />
                  地图选点
                </button>
              </div>
              {lng != null && lat != null && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-neon-cyan/70">
                  <MapPin className="h-3 w-3" />
                  已定位：{lng.toFixed(4)}°E, {lat.toFixed(4)}°N
                </p>
              )}
              <p className="mt-1.5 text-xs text-star-dim/70">
                💡 点击「地图选点」在高德地图弹窗中搜索并选择地址，也可手动输入
              </p>
            </div>
          </div>

          {/* 地址选择器弹窗 */}
          {showAddressPicker && (
            <AddressPicker
              initialAddress={address}
              onSelect={handleAddressSelect}
              onClose={() => setShowAddressPicker(false)}
            />
          )}

          {/* 启用开关 - 按钮式（点击切换状态） */}
          <div className="flex items-center justify-between rounded-lg border border-space-600 bg-space-700/50 px-3 py-2.5">
            <div>
              <span className="text-sm font-medium text-star-white">启用状态</span>
              <p className="text-xs text-star-dim/60">停用后广告不会在首页展示</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-neon-blue text-white hover:bg-neon-blue/80'
                  : 'bg-space-600 text-star-dim hover:bg-space-500'
              }`}
            >
              {active ? '✓ 启用中' : '已停用'}
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>取消</Button>
            <Button variant="primary" size="sm" type="submit">{ad ? '保存修改' : '创建广告'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
