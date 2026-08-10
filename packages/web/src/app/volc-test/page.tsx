'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { volcUpload, volcEnhance, volcAiUpscale } from '@/services/volc'
import CompareViewer from '@/components/fits/compare-viewer'

/* 模型选项 */
const MODELS = [
  { id: 'standard', label: 'standard 标准版', desc: '保真优先，改动最小' },
  { id: 'professional', label: 'professional 专业版', desc: '平衡清晰度与保真' },
  { id: 'max', label: 'max 大模型增强', desc: '补充细节，差异最明显' },
  { id: 'aigc', label: 'AIGC 大模型超分', desc: 'veImageX 生成式补细节，最高 30x' },
] as const

type ModelResult = {
  toolVersion: string
  image_url: string
  image_width: number
  image_height: number
  image_format: string
  image_size: number
}

/* 火山引擎图像画质增强测试页（隐藏路由，仅管理员） */
export default function VolcTestPage() {
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuthStore()

  const fileRef = useRef<HTMLInputElement>(null)
  const [originalUrl, setOriginalUrl] = useState('')
  const [fileId, setFileId] = useState('')
  const [fileName, setFileName] = useState('')

  /* 默认选中 max + 4x，让差异易见 */
  const [selectedModels, setSelectedModels] = useState<string[]>(['max'])
  const [multiple, setMultiple] = useState('4')
  const [useMultiple, setUseMultiple] = useState(true)
  const [targetWidth, setTargetWidth] = useState('')
  const [targetHeight, setTargetHeight] = useState('')
  /* AIGC 超分：需要公网可访问的原图 URL */
  const [aigcUrl, setAigcUrl] = useState('')

  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [results, setResults] = useState<ModelResult[]>([])
  const [activeResult, setActiveResult] = useState<string>('')

  /* 后处理：锐化 + 对比度（修正火山超分后的平滑感） */
  const [sharpness, setSharpness] = useState(0.8) // 0-2，锐化强度
  const [contrast, setContrast] = useState(1.1) // 0.8-1.6，对比度倍率

  /* 鉴权：未登录或非管理员跳转登录 */
  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/login')
    } else if (user?.role !== 'admin') {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-space-900 text-star-dim">
        权限校验中...
      </div>
    )
  }

  /** 切换模型多选 */
  const toggleModel = (id: string) => {
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  /** 选择文件：本地预览 + 自动缩放（兼容火山尺寸限制）+ 上传 */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setResults([])
    setActiveResult('')
    setFileName(file.name)
    setFileId('')
    setOriginalUrl(URL.createObjectURL(file))

    setLoading(true)
    setStage('正在处理图片...')
    try {
      const { blob, resized } = await normalizeImage(file)
      if (resized) setStage('原图超出火山尺寸限制，已自动缩放')
      const id = await volcUpload(blob)
      setFileId(id)
      setStage(resized ? '已缩放并上传成功' : '上传成功，可提交增强')
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setLoading(false)
    }
  }

  /** 提交增强（可多模型并发） */
  const handleEnhance = async () => {
    if (!fileId) {
      setError('请先上传图片')
      return
    }
    if (selectedModels.length === 0) {
      setError('请至少选择一个模型')
      return
    }
    setError('')
    setResults([])
    setActiveResult('')
    setLoading(true)
    setStage(
      `正在用 ${selectedModels.length} 个模型并发增强（multiple=${useMultiple ? multiple : '默认'}）...`,
    )
    try {
      const tasks = selectedModels.map(async (tv) => {
        if (tv === 'aigc') {
          if (!aigcUrl.trim()) {
            throw new Error('AIGC 超分需要填写公网原图 URL')
          }
          const res = await volcAiUpscale({
            imageUrl: aigcUrl.trim(),
            multiple: useMultiple && multiple ? parseFloat(multiple) : undefined,
          })
          return {
            toolVersion: tv,
            image_url: res.image_url,
            image_width: 0,
            image_height: 0,
            image_format: res.format,
            image_size: res.size,
          } as ModelResult
        }
        const res = await volcEnhance({
          imageUrl: fileId,
          toolVersion: tv,
          multiple: useMultiple && multiple ? parseFloat(multiple) : undefined,
          targetWidth: targetWidth ? parseInt(targetWidth, 10) : undefined,
          targetHeight: targetHeight ? parseInt(targetHeight, 10) : undefined,
        })
        return { toolVersion: tv, ...res } as ModelResult
      })
      const done = await Promise.all(tasks)
      setResults(done)
      setActiveResult(done[0]?.toolVersion || '')
      setStage('增强完成，拖动滑块对比前后差异')
    } catch (err) {
      setError(err instanceof Error ? err.message : '增强失败')
    } finally {
      setLoading(false)
    }
  }

  /** Canvas 后处理：锐化（卷积核）+ 对比度，修正火山超分后的平滑感 */
  const enhanceImage = (blob: Blob, sharp: number, contrast: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)

        // 对比度：线性映射 c*(v-128)+128
        if (contrast !== 1) {
          const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const d = id.data
          const c = contrast
          for (let i = 0; i < d.length; i += 4) {
            for (let k = 0; k < 3; k++) {
              d[i + k] = Math.max(0, Math.min(255, c * (d[i + k] - 128) + 128))
            }
          }
          ctx.putImageData(id, 0, 0)
        }

        // 锐化：3x3 拉普拉斯锐化卷积核
        if (sharp > 0) {
          const w = canvas.width
          const h = canvas.height
          const src = ctx.getImageData(0, 0, w, h).data
          const out = new Uint8ClampedArray(src.length)
          const amount = sharp * 20 // 锐化强度系数
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const i = (y * w + x) * 4
              for (let k = 0; k < 3; k++) {
                const center = src[(y * w + x) * 4 + k]
                const up = src[((y - 1) * w + x) * 4 + k]
                const down = src[((y + 1) * w + x) * 4 + k]
                const left = src[(y * w + x - 1) * 4 + k]
                const right = src[(y * w + x + 1) * 4 + k]
                const sharpened = center + amount * (4 * center - up - down - left - right)
                out[i + k] = Math.max(0, Math.min(255, sharpened))
              }
              out[i + 3] = src[i + 3]
            }
          }
          ctx.putImageData(new ImageData(out, w, h), 0, 0)
        }

        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('图片处理失败'))),
          'image/png',
        )
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(blob)
    })
  }

  /** 将图片缩放至火山支持尺寸（宽高均 ≤2048 且 ≥256），保持宽高比 */
  const normalizeImage = async (file: File): Promise<{ blob: Blob; resized: boolean }> => {
    const bitmap = await createImageBitmap(file)
    const ow = bitmap.width
    const oh = bitmap.height
    const maxDim = Math.max(ow, oh)
    const minDim = Math.min(ow, oh)
    let scale = 1
    if (maxDim > 2048) scale = 2048 / maxDim
    else if (minDim < 256) scale = 256 / minDim
    if (scale === 1) {
      bitmap.close()
      return { blob: file, resized: false }
    }
    const w = Math.round(ow * scale)
    const h = Math.round(oh * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('图片处理失败'))),
        'image/jpeg',
        0.95,
      ),
    )
    return { blob, resized: true }
  }

  /** 通过后端代理拉取图片（规避 CORS），并应用锐化/对比度后导出 */
  const handleDownload = async (r: ModelResult) => {
    setDownloading(true)
    setError('')
    try {
      // 经后端代理获取原始字节（浏览器直接 fetch 火山 URL 会因 CORS 失败）
      const token = localStorage.getItem('auth_token')
      const proxy = await fetch(`/api/volc/image?url=${encodeURIComponent(r.image_url)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!proxy.ok) throw new Error('下载失败')
      const blob = await proxy.blob()

      // 加载到 canvas 做锐化 + 对比度后处理
      const processed = await enhanceImage(blob, sharpness, contrast)
      const url = URL.createObjectURL(processed)
      const a = document.createElement('a')
      a.href = url
      a.download = `enhanced-${r.toolVersion}-${fileName || 'image'}.${processed.type.includes('png') ? 'png' : 'jpeg'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载失败')
    } finally {
      setDownloading(false)
    }
  }

  const active = results.find((r) => r.toolVersion === activeResult) || results[0]

  return (
    <div className="min-h-screen bg-space-900 p-6 text-star-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-neon-blue">图像画质增强测试</h1>
        <p className="mt-1 text-sm text-star-dim">
          隐藏测试页 · 仅管理员可见 · {fileName || '未选择图片'}
          {fileId && <span className="ml-2 text-green-400">已上传 ✓</span>}
        </p>

        {/* 流程步骤指示 */}
        <div className="mt-4 flex items-center gap-2 text-sm">
          {[
            { label: '1 上传图片', done: !!fileId },
            { label: '2 AI 增强', done: results.length > 0 },
            { label: '3 对比导出', done: results.length > 0 },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-space-600">→</span>}
              <span
                className={`rounded-full px-3 py-1 ${
                  s.done
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-space-700 text-star-dim'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* 参数区 */}
        <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-space-700 bg-space-800 p-5 md:grid-cols-2">
          <div>
            <label className="block text-sm text-star-dim">上传测试图片 (≤10MB)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleFileChange}
              className="mt-1 block w-full cursor-pointer rounded-lg border border-space-600 bg-space-700 p-2 text-sm text-star-white"
            />
            <p className="mt-1 text-xs text-star-dim">
              建议上传带细节的照片（星云、月亮、文字、建筑），便于对比增强效果
            </p>
          </div>

          {/* 模型选择（多选） */}
          <div>
            <label className="block text-sm text-star-dim">增强模型（可多选并发对比）</label>
            <div className="mt-1 space-y-1.5">
              {MODELS.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedModels.includes(m.id)
                      ? 'border-neon-blue/60 bg-neon-blue/10'
                      : 'border-space-600 bg-space-700 hover:border-space-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(m.id)}
                    onChange={() => toggleModel(m.id)}
                    className="h-4 w-4"
                  />
                  <span>
                    <span className="font-medium">{m.label}</span>
                    <span className="ml-2 text-xs text-star-dim">{m.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-star-dim">
              <input
                type="checkbox"
                checked={useMultiple}
                onChange={(e) => setUseMultiple(e.target.checked)}
                className="h-4 w-4"
              />
              指定放大倍数
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={multiple}
              disabled={!useMultiple}
              onChange={(e) => setMultiple(e.target.value)}
              className="mt-1 w-full rounded-lg border border-space-600 bg-space-700 p-2 text-sm disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-star-dim">倍数越高，放大后细节差异越明显（建议 2-8x）</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-star-dim">目标宽度 (px，可选)</label>
              <input
                type="number"
                value={targetWidth}
                onChange={(e) => setTargetWidth(e.target.value)}
                className="mt-1 w-full rounded-lg border border-space-600 bg-space-700 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-star-dim">目标高度 (px，可选)</label>
              <input
                type="number"
                value={targetHeight}
                onChange={(e) => setTargetHeight(e.target.value)}
                className="mt-1 w-full rounded-lg border border-space-600 bg-space-700 p-2 text-sm"
              />
            </div>
          </div>

          {/* AIGC 超分：公网原图 URL（仅在选中 AIGC 时显示） */}
          {selectedModels.includes('aigc') && (
            <div className="md:col-span-2">
              <label className="block text-sm text-star-dim">
                AIGC 原图公网 URL（veImageX 需要可访问的图片地址）
              </label>
              <input
                type="text"
                value={aigcUrl}
                onChange={(e) => setAigcUrl(e.target.value)}
                placeholder="https://.../原图.jpg"
                className="mt-1 w-full rounded-lg border border-space-600 bg-space-700 p-2 text-sm"
              />
              <p className="mt-1 text-xs text-star-dim">
                可填本地上传后增强结果的图片链接，或任意公网图片地址
              </p>
            </div>
          )}

          {/* 后处理：锐化 + 对比度 */}
          <div>
            <label className="flex items-center justify-between text-sm text-star-dim">
              锐化强度
              <span className="text-neon-blue">{sharpness.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={sharpness}
              onChange={(e) => setSharpness(parseFloat(e.target.value))}
              className="mt-1 w-full accent-neon-blue"
            />
            <p className="mt-1 text-xs text-star-dim">修正火山超分后的平滑感（0=不锐化）</p>
          </div>
          <div>
            <label className="flex items-center justify-between text-sm text-star-dim">
              对比度
              <span className="text-neon-blue">{contrast.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0.8}
              max={1.6}
              step={0.05}
              value={contrast}
              onChange={(e) => setContrast(parseFloat(e.target.value))}
              className="mt-1 w-full accent-neon-blue"
            />
            <p className="mt-1 text-xs text-star-dim">数值越高，明暗对比越强（1.0=不变）</p>
          </div>

          <div className="md:col-span-2">
            <button
              onClick={handleEnhance}
              disabled={loading || !fileId}
              className="w-full rounded-lg bg-neon-blue py-2.5 text-sm font-semibold text-space-900 transition-colors hover:bg-neon-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '增强中...' : `开始增强（${selectedModels.length} 个模型）`}
            </button>
            {loading && <p className="mt-2 text-center text-sm text-star-dim">{stage}</p>}
          </div>
        </div>

        {/* 结果区 */}
        {results.length > 0 && active && (
          <div className="mt-6 space-y-4">
            {/* 模型结果标签页 */}
            <div className="flex flex-wrap items-center gap-2">
              {results.map((r) => (
                <button
                  key={r.toolVersion}
                  onClick={() => setActiveResult(r.toolVersion)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    activeResult === r.toolVersion
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-space-700 text-star-dim hover:text-star-white'
                  }`}
                >
                  {MODELS.find((m) => m.id === r.toolVersion)?.label || r.toolVersion} ·{' '}
                  {r.image_width}×{r.image_height}
                </button>
              ))}
            </div>

            {/* 对比查看器：原图 vs 增强后 */}
            <CompareViewer
              beforeUrl={originalUrl}
              afterUrl={active.image_url}
              afterLabel={`${active.image_width}×${active.image_height}`}
              magnification={useMultiple ? `${multiple}x` : '默认'}
            />

            {/* 下载 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDownload(active)}
                disabled={downloading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloading ? '下载中...' : '⬇ 导出下载'}
              </button>
              <a
                href={active.image_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-neon-blue hover:underline"
              >
                新窗口打开增强图（24h 有效）
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}