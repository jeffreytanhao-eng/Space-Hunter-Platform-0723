'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  processImage,
  pollJob,
  getHistory,
  deleteJob,
  type ProcessJob,
} from '@/services/image-process'
import CompareViewer from '@/components/fits/compare-viewer'

/* 风格选项 */
const STYLES = [
  { id: 'deepspace', label: '深空', desc: '增强星云对比' },
  { id: 'milkyway', label: '银河', desc: '突出银河带' },
  { id: 'nebula', label: '星云', desc: '强化色彩' },
  { id: 'galaxy', label: '星系', desc: '提升旋臂细节' },
] as const

/* 格式化文件大小 */
function formatSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/* 格式化时间 */
function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/* 拼接图片完整 URL */
function imageUrl(path: string | null): string | null {
  if (!path) return null
  return path
}

/** 历史记录每页条数（减小以降低超大图渲染压力） */
const HISTORY_PAGE_SIZE = 6

/** 生成缩略预览图 URL（避免前端解码超大原图） */
function makeThumbUrl(file: File, maxW = 1200): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const w = Math.min(img.naturalWidth, maxW)
        const scale = w / img.naturalWidth
        const h = Math.round(img.naturalHeight * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(url)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(URL.createObjectURL(blob))
            else resolve(url)
          },
          'image/jpeg',
          0.85,
        )
      } catch {
        resolve(url)
      }
    }
    img.onerror = () => resolve(url)
    img.src = url
  })
}

export default function VolcTestPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [originalUrl, setOriginalUrl] = useState('')
  const [fileName, setFileName] = useState('')

  /* 通道 A 模式与参数 */
  const [styleA, setStyleA] = useState<'classic' | 'smart'>('classic')
  /* 经典天文模式参数 */
  const [beta, setBeta] = useState(4.0)
  const [residualRef, setResidualRef] = useState(50.0)
  /* 智能增强模式参数 */
  const [stretch, setStretch] = useState<'asinh' | 'log' | 'sqrt' | 'linear'>('asinh')
  const [zscaleContrast, setZscaleContrast] = useState(0.25)
  const [asinhA, setAsinhA] = useState(0.5)
  const [boxSize, setBoxSize] = useState(128)
  const [enableCosmics, setEnableCosmics] = useState(true)
  const [cosmicsSigclip, setCosmicsSigclip] = useState(4.5)

  /* 通道 B 参数 */
  const [style, setStyle] = useState('deepspace')
  const [intensity, setIntensity] = useState(0.5)

  /* 状态 */
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [currentJob, setCurrentJob] = useState<ProcessJob | null>(null)
  const [activeChannel, setActiveChannel] = useState<'A' | 'B'>('A')

  /* 历史记录 */
  const [history, setHistory] = useState<ProcessJob[]>([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [selectedHistoryJob, setSelectedHistoryJob] = useState<ProcessJob | null>(null)
  // 待删除确认的记录（非阻塞弹窗，避免 window.confirm 在部分 webview 中导致问题）
  const [pendingDelete, setPendingDelete] = useState<ProcessJob | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* 加载历史记录（全局共享，无需 sessionId） */
  const loadHistory = useCallback(async (page = 1) => {
    try {
      const res = await getHistory(page, HISTORY_PAGE_SIZE)
      setHistory(res.data)
      setHistoryTotal(res.total)
      setHistoryPage(page)
    } catch {
      // 忽略错误
    }
  }, [])

  useEffect(() => {
    loadHistory(1)
  }, [loadHistory])

  /** 选择文件 */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setCurrentJob(null)
    setFileName(file.name)
    // 用缩略图做预览，避免前端解码超大原图
    makeThumbUrl(file).then(setOriginalUrl)
  }

  /** 统一提交处理
   * mode: 'A' 仅通道A, 'B' 仅通道B, 'both' 双通道
   */
  const submitProcess = async (mode: 'A' | 'B' | 'both') => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('请先选择图片')
      return
    }

    setError('')
    setLoading(true)
    const modeText = mode === 'both' ? '双通道处理' : `通道 ${mode} 处理`
    setStage(`正在上传并启动${modeText}...`)
    setCurrentJob(null)

    try {
      const job = await processImage({
        file,
        mode,
        styleA,
        beta,
        residualRef,
        stretch,
        zscaleContrast,
        asinhA,
        boxSize,
        enableCosmics,
        cosmicsSigclip,
        style,
        intensity,
      })
      setCurrentJob(job)
      // 默认展示实际执行的通道
      setActiveChannel(mode === 'B' ? 'B' : 'A')
      setStage('处理中，请等待...')

      // 轮询直到完成
      const finalJob = await pollJob(job.id, (updated) => {
        setCurrentJob(updated)
        const aProcessing = updated.channelAStatus === 'processing'
        const bProcessing = updated.channelBStatus === 'processing'
        if (aProcessing && bProcessing) setStage('通道 A + B 同时处理中...')
        else if (aProcessing) setStage('通道 A 处理中...')
        else if (bProcessing) setStage('通道 B 处理中...')
      })

      setCurrentJob(finalJob)
      setStage('处理完成')
      loadHistory(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败')
    } finally {
      setLoading(false)
    }
  }

  /** 下载图片 */
  const handleDownload = (url: string, label: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `${label}-${fileName || 'image'}.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  /** 点击历史记录项 */
  const handleHistoryClick = (job: ProcessJob) => {
    setSelectedHistoryJob(job)
    setActiveChannel('A')
  }

  /** 点击删除按钮：弹出确认（非阻塞） */
  const handleDeleteClick = useCallback((e: React.MouseEvent, job: ProcessJob) => {
    e.stopPropagation()
    setPendingDelete(job)
  }, [])

  /** 确认删除 */
  const confirmDelete = useCallback(async () => {
    const job = pendingDelete
    if (!job || deleting) return
    setDeleting(true)
    try {
      await deleteJob(job.id)
      // 从列表中移除
      setHistory((prev) => prev.filter((j) => j.id !== job.id))
      setHistoryTotal((prev) => prev - 1)
      if (selectedHistoryJob?.id === job.id) {
        setSelectedHistoryJob(null)
      }
      setPendingDelete(null)
    } catch (err: any) {
      setError('删除失败：' + (err?.message || err))
    } finally {
      setDeleting(false)
    }
  }, [pendingDelete, deleting, selectedHistoryJob])

  /** 当前展示的任务（新处理的或历史选中的） */
  const displayJob = selectedHistoryJob || currentJob

  /** 当前通道的结果 URL */
  const getResultUrl = (job: ProcessJob | null): string | null => {
    if (!job) return null
    return imageUrl(activeChannel === 'A' ? job.channelAPath : job.channelBPath)
  }

  const resultUrl = getResultUrl(displayJob)
  const resultStatus = displayJob
    ? activeChannel === 'A'
      ? displayJob.channelAStatus
      : displayJob.channelBStatus
    : ''

  /** 当前通道结果尺寸信息 */
  const resultSize = displayJob
    ? activeChannel === 'A'
      ? displayJob.channelASize
      : displayJob.channelBSize
    : null
  const resultWidth = displayJob
    ? activeChannel === 'A'
      ? displayJob.channelAWidth
      : displayJob.channelBWidth
    : null
  const resultHeight = displayJob
    ? activeChannel === 'A'
      ? displayJob.channelAHeight
      : displayJob.channelBHeight
    : null

  return (
    <div className="min-h-screen bg-space-900 p-6 text-star-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-neon-blue">双通道图像增强测试</h1>
        <p className="mt-1 text-sm text-star-dim">
          无需登录 · 通道 A 保真增强（去背景+宇宙线+ZScale拉伸） · 通道 B AI 渲染（开发中，当前为占位效果）
        </p>

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* 处理状态条 */}
        {loading && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-neon-blue/30 bg-neon-blue/10 px-4 py-2 text-sm text-neon-blue">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
            {stage}
          </div>
        )}

        {/* 三列：上传区 + 通道A卡片 + 通道B卡片 */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* 左列：上传区 */}
          <div className="space-y-4 rounded-xl border border-space-700 bg-space-800 p-4">
            <div className="text-sm font-medium text-star-white">上传图片</div>
            <div>
              <label className="block text-xs text-star-dim">选择图片 (JPEG/PNG, ≤20MB)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="mt-1 block w-full cursor-pointer rounded-lg border border-space-600 bg-space-700 p-2 text-sm text-star-white"
              />
              <p className="mt-1 text-xs text-star-dim">
                建议上传天文照片（星云、银河、深空）
              </p>
              {fileName && (
                <p className="mt-1 text-xs text-green-400">已选择: {fileName}</p>
              )}
            </div>

            {/* 原图预览 */}
            {originalUrl && (
              <div className="overflow-hidden rounded-lg border border-space-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalUrl}
                  alt="原图预览"
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}

            {/* 一键双通道按钮 */}
            <button
              onClick={() => submitProcess('both')}
              disabled={loading || !fileName}
              className="w-full rounded-lg bg-gradient-to-r from-neon-blue to-purple-500 py-2.5 text-sm font-semibold text-space-900 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '处理中...' : '⚡ 一键双通道处理'}
            </button>
            <p className="-mt-2 text-center text-xs text-star-dim">
              同时执行通道 A 和通道 B
            </p>
          </div>

          {/* 中列：通道 A 卡片 */}
          <div className="rounded-xl border border-neon-blue/30 bg-space-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-neon-blue">通道 A — 保真增强</div>
                <div className="text-xs text-star-dim">去背景 · 宇宙线 · 天文拉伸</div>
              </div>
              <div className="rounded-full bg-neon-blue/10 px-2 py-0.5 text-xs text-neon-blue">
                astropy
              </div>
            </div>

            {/* 模式分段选择器 */}
            <div className="mb-3 flex rounded-lg border border-space-600 bg-space-700 p-0.5 text-xs">
              <button
                onClick={() => setStyleA('classic')}
                className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                  styleA === 'classic'
                    ? 'bg-neon-blue text-space-900'
                    : 'text-star-dim hover:text-star-white'
                }`}
              >
                经典天文模式
              </button>
              <button
                onClick={() => setStyleA('smart')}
                className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                  styleA === 'smart'
                    ? 'bg-neon-blue text-space-900'
                    : 'text-star-dim hover:text-star-white'
                }`}
              >
                智能增强模式
              </button>
            </div>

            <div className="space-y-3">
              {styleA === 'classic' ? (
                <>
                  {/* 经典：asinh 拉伸强度 (beta) */}
                  <div>
                    <label className="flex items-center justify-between text-xs text-star-dim">
                      <span>拉伸强度（越小暗部提升越强）</span>
                      <span className="text-neon-blue">{beta.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={20}
                      step={0.5}
                      value={beta}
                      onChange={(e) => setBeta(parseFloat(e.target.value))}
                      className="mt-1 w-full accent-neon-blue"
                    />
                  </div>

                  {/* 经典：残差参考值 */}
                  <div>
                    <label className="flex items-center justify-between text-xs text-star-dim">
                      <span>残差参考值（背景基准）</span>
                      <span className="text-neon-blue">{residualRef.toFixed(0)}</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={200}
                      step={5}
                      value={residualRef}
                      onChange={(e) => setResidualRef(parseFloat(e.target.value))}
                      className="mt-1 w-full accent-neon-blue"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* 拉伸方式 */}
                  <div>
                    <label className="block text-xs text-star-dim">拉伸方式</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(['asinh', 'log', 'sqrt', 'linear'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStretch(s)}
                          className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                            stretch === s
                              ? 'border-neon-blue/60 bg-neon-blue/10 text-neon-blue'
                              : 'border-space-600 bg-space-700 text-star-dim hover:text-star-white'
                          }`}
                        >
                          {s === 'asinh' ? 'Asinh' : s === 'log' ? 'Log' : s === 'sqrt' ? 'Sqrt' : '线性'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ZScale 对比度 */}
                  <div>
                    <label className="flex items-center justify-between text-xs text-star-dim">
                      <span>ZScale 对比度（越小越暗）</span>
                      <span className="text-neon-blue">{zscaleContrast.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min={0.05}
                      max={0.5}
                      step={0.01}
                      value={zscaleContrast}
                      onChange={(e) => setZscaleContrast(parseFloat(e.target.value))}
                      className="mt-1 w-full accent-neon-blue"
                    />
                  </div>

                  {/* Asinh a 参数 */}
                  {stretch === 'asinh' && (
                    <div>
                      <label className="flex items-center justify-between text-xs text-star-dim">
                        <span>Asinh 强度（越小暗部越强）</span>
                        <span className="text-neon-blue">{asinhA.toFixed(3)}</span>
                      </label>
                      <input
                        type="range"
                        min={0.001}
                        max={1.0}
                        step={0.005}
                        value={asinhA}
                        onChange={(e) => setAsinhA(parseFloat(e.target.value))}
                        className="mt-1 w-full accent-neon-blue"
                      />
                    </div>
                  )}

                  {/* 背景网格大小 */}
                  <div>
                    <label className="flex items-center justify-between text-xs text-star-dim">
                      <span>背景网格大小（越大越平滑）</span>
                      <span className="text-neon-blue">{boxSize} px</span>
                    </label>
                    <input
                      type="range"
                      min={32}
                      max={256}
                      step={16}
                      value={boxSize}
                      onChange={(e) => setBoxSize(parseInt(e.target.value, 10))}
                      className="mt-1 w-full accent-neon-blue"
                    />
                  </div>
                </>
              )}

              {/* 宇宙线去除开关 */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-star-dim">宇宙线去除 (astroscrappy)</label>
                <button
                  type="button"
                  onClick={() => setEnableCosmics(!enableCosmics)}
                  role="switch"
                  aria-checked={enableCosmics}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neon-blue/50 ${
                    enableCosmics ? 'bg-neon-blue' : 'bg-space-600'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      enableCosmics ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 宇宙线敏感度 */}
              {enableCosmics && (
                <div>
                  <label className="flex items-center justify-between text-xs text-star-dim">
                    <span>敏感度</span>
                    <span className="text-neon-blue">{cosmicsSigclip.toFixed(1)}σ</span>
                  </label>
                  <input
                    type="range"
                    min={2.0}
                    max={8.0}
                    step={0.1}
                    value={cosmicsSigclip}
                    onChange={(e) => setCosmicsSigclip(parseFloat(e.target.value))}
                    className="mt-1 w-full accent-neon-blue"
                  />
                </div>
              )}
            </div>

            {/* 单独执行按钮 */}
            <button
              onClick={() => submitProcess('A')}
              disabled={loading || !fileName}
              className="mt-4 w-full rounded-lg border border-neon-blue/50 bg-neon-blue/10 py-2 text-sm font-medium text-neon-blue transition-colors hover:bg-neon-blue/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              仅执行通道 A
            </button>
          </div>

          {/* 右列：通道 B 卡片 */}
          <div className="rounded-xl border border-purple-400/30 bg-space-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-purple-300">通道 B — AI 渲染</div>
                <div className="text-xs text-star-dim">风格化 · 艺术增强</div>
              </div>
              <div className="rounded-full bg-purple-400/10 px-2 py-0.5 text-xs text-purple-300">
                SD+LoRA
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-star-dim">风格选择</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        style === s.id
                          ? 'border-purple-400/60 bg-purple-400/10 text-purple-300'
                          : 'border-space-600 bg-space-700 text-star-dim hover:text-star-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center justify-between text-xs text-star-dim">
                  <span>艺术强度</span>
                  <span className="text-purple-300">{intensity.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={intensity}
                  onChange={(e) => setIntensity(parseFloat(e.target.value))}
                  className="mt-1 w-full accent-purple-400"
                />
                <p className="mt-1 text-xs text-star-dim">
                  当前为占位效果，未来接入 SD+LoRA
                </p>
              </div>
            </div>

            {/* 单独执行按钮 */}
            <button
              onClick={() => submitProcess('B')}
              disabled={loading || !fileName}
              className="mt-4 w-full rounded-lg border border-purple-400/50 bg-purple-400/10 py-2 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-400/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              仅执行通道 B
            </button>
          </div>
        </div>

        {/* 结果对比区 */}
        {displayJob && resultUrl && resultStatus === 'done' && (
          <div className="mt-6 space-y-4">
            {/* 通道切换 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveChannel('A')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeChannel === 'A'
                    ? 'bg-neon-blue/20 text-neon-blue'
                    : 'bg-space-700 text-star-dim hover:text-star-white'
                }`}
              >
                通道 A（保真增强）
              </button>
              <button
                onClick={() => setActiveChannel('B')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeChannel === 'B'
                    ? 'bg-purple-400/20 text-purple-300'
                    : 'bg-space-700 text-star-dim hover:text-star-white'
                }`}
              >
                通道 B（AI 渲染{displayJob.channelBStatus === 'done' ? '' : '·占位'})
              </button>
            </div>

            {/* 尺寸信息 */}
            <div className="flex flex-wrap gap-4 rounded-lg border border-space-700 bg-space-800 px-4 py-2 text-xs text-star-dim">
              <span>原图: {displayJob.originalWidth}×{displayJob.originalHeight} ({formatSize(displayJob.originalSize)})</span>
              <span>→</span>
              <span className="text-neon-blue">
                {activeChannel === 'A' ? '通道A' : '通道B'}结果: {resultWidth}×{resultHeight} ({formatSize(resultSize)})
              </span>
            </div>

            {/* 对比查看器 */}
            <CompareViewer
              beforeUrl={displayJob.originalPath}
              afterUrl={resultUrl}
              afterLabel={`${displayJob.originalWidth}×${displayJob.originalHeight}`}
            />

            {/* 下载 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDownload(resultUrl, `channel-${activeChannel}`)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-500"
              >
                ⬇ 下载结果
              </button>
              <button
                onClick={() => handleDownload(displayJob.originalPath, 'original')}
                className="rounded-lg border border-space-600 bg-space-700 px-4 py-2 text-sm font-semibold text-star-white transition-colors hover:border-space-500"
              >
                ⬇ 下载原图
              </button>
              {selectedHistoryJob && (
                <button
                  onClick={() => setSelectedHistoryJob(null)}
                  className="ml-auto text-sm text-neon-blue hover:underline"
                >
                  ← 返回新处理结果
                </button>
              )}
            </div>
          </div>
        )}

        {/* 处理中状态显示 */}
        {displayJob && (resultStatus === 'processing' || resultStatus === 'pending') && (
          <div className="mt-6 rounded-xl border border-space-700 bg-space-800 p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
            <p className="mt-3 text-sm text-star-dim">
              {activeChannel === 'A' ? '通道 A' : '通道 B'} 处理中...
            </p>
          </div>
        )}

        {/* 处理失败 */}
        {displayJob && resultStatus === 'failed' && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {activeChannel === 'A' ? '通道 A' : '通道 B'} 处理失败：
            {(activeChannel === 'A' ? displayJob.channelAError : displayJob.channelBError) || '未知错误'}
          </div>
        )}

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-star-white">处理历史</h2>
              <span className="text-xs text-star-dim">共 {historyTotal} 条</span>
            </div>

            {/* 历史记录网格：每项显示原图和渲染后图片 */}
            <div className="mt-3 space-y-3">
              {history.map((job) => {
                const isActive = selectedHistoryJob?.id === job.id
                return (
                  <div
                    key={job.id}
                    onClick={() => handleHistoryClick(job)}
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-colors ${
                      isActive
                        ? 'border-neon-blue bg-space-800'
                        : 'border-space-700 bg-space-800/50 hover:border-space-500'
                    }`}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 230px' }}
                  >
                    {/* 文件信息 */}
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="truncate text-star-white">{job.originalName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-star-dim">{formatTime(job.createdAt)}</span>
                        <button
                          onClick={(e) => handleDeleteClick(e, job)}
                          className="rounded p-1 text-star-dim transition-colors hover:bg-red-500/20 hover:text-red-400"
                          title="删除此记录"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* 原图和结果对比缩略图 */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* 原图 */}
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={job.originalPath}
                          alt="原图"
                          loading="lazy"
                          decoding="async"
                          className="aspect-video w-full rounded-lg object-cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                          原图 {job.originalWidth}×{job.originalHeight}
                        </span>
                      </div>
                      {/* 通道 A */}
                      <div className="relative">
                        {job.channelAPath && job.channelAStatus === 'done' ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={job.channelAPath}
                              alt="通道A"
                              loading="lazy"
                              decoding="async"
                              className="aspect-video w-full rounded-lg object-cover"
                            />
                            <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-neon-blue">
                              A {job.channelAWidth}×{job.channelAHeight}
                            </span>
                          </>
                        ) : (
                          <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-space-700 text-xs text-star-dim">
                            {job.channelAStatus === 'failed' ? 'A 失败' : job.channelAStatus === 'skipped' ? '—' : 'A 处理中'}
                          </div>
                        )}
                      </div>
                      {/* 通道 B */}
                      <div className="relative">
                        {job.channelBPath && job.channelBStatus === 'done' ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={job.channelBPath}
                              alt="通道B"
                              loading="lazy"
                              decoding="async"
                              className="aspect-video w-full rounded-lg object-cover"
                            />
                            <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-purple-300">
                              B {job.channelBWidth}×{job.channelBHeight}
                            </span>
                          </>
                        ) : (
                          <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-space-700 text-xs text-star-dim">
                            {job.channelBStatus === 'failed' ? 'B 失败' : job.channelBStatus === 'skipped' ? '—' : 'B 处理中'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 分页 */}
            {historyTotal > HISTORY_PAGE_SIZE && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => loadHistory(historyPage - 1)}
                  disabled={historyPage <= 1}
                  className="rounded-lg border border-space-600 bg-space-700 px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="px-3 py-1.5 text-sm text-star-dim">
                  {historyPage} / {Math.ceil(historyTotal / HISTORY_PAGE_SIZE)}
                </span>
                <button
                  onClick={() => loadHistory(historyPage + 1)}
                  disabled={historyPage >= Math.ceil(historyTotal / HISTORY_PAGE_SIZE)}
                  className="rounded-lg border border-space-600 bg-space-700 px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 删除确认弹窗（非阻塞，替代 window.confirm） */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border border-space-600 bg-space-800 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-semibold text-star-white">确认删除</div>
            <p className="mt-2 break-all text-sm text-star-dim">
              确定要删除「{pendingDelete.originalName}」吗？删除后不可恢复。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="rounded-lg border border-space-600 bg-space-700 px-4 py-2 text-sm text-star-white transition-colors hover:border-space-500 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? '删除中...' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
