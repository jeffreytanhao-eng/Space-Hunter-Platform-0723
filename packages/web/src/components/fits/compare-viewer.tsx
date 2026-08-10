'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface CompareViewerProps {
  /** 原始图（增强前）URL */
  beforeUrl: string
  /** 增强后图片 URL */
  afterUrl: string
  /** 增强后图片尺寸标注，如 "2048×2048" */
  afterLabel?: string
  /** 放大倍数标注，如 "4x" */
  magnification?: string
}

/**
 * 增强前后对比查看器：
 * - 左右拖动滑块进行 before/after 对比
 * - 滚轮缩放查看局部细节（默认 1x，最高 8x）
 * - 拖拽平移查看画面
 * - 点击按钮切换"对比 / 放大局部"两种查看模式
 */
export default function CompareViewer({
  beforeUrl,
  afterUrl,
  afterLabel,
  magnification,
}: CompareViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50) // 对比滑块位置 0-100
  const [mode, setMode] = useState<'compare' | 'zoom'>('compare')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  /* 滑块拖动对比 */
  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.min(100, Math.max(0, pct)))
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (mode === 'compare') {
      dragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      updateFromClientX(e.clientX)
    } else {
      dragging.current = true
      dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    if (mode === 'compare') {
      updateFromClientX(e.clientX)
    } else {
      setPan({
        x: dragStart.current.panX + (e.clientX - dragStart.current.x),
        y: dragStart.current.panY + (e.clientY - dragStart.current.y),
      })
    }
  }

  const onPointerUp = () => {
    dragging.current = false
  }

  /* 滚轮缩放（仅放大模式） */
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (mode !== 'zoom') return
      e.preventDefault()
      setZoom((z) => Math.min(8, Math.max(1, z - e.deltaY * 0.002)))
    },
    [mode],
  )

  useEffect(() => {
    // 切换模式时重置缩放/平移
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [mode])

  return (
    <div className="space-y-2">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-space-700 p-1 text-xs">
          <button
            onClick={() => setMode('compare')}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              mode === 'compare'
                ? 'bg-neon-blue text-space-900'
                : 'text-star-dim hover:text-star-white'
            }`}
          >
            对比（拖动滑块）
          </button>
          <button
            onClick={() => setMode('zoom')}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              mode === 'zoom'
                ? 'bg-neon-blue text-space-900'
                : 'text-star-dim hover:text-star-white'
            }`}
          >
            放大局部（滚轮缩放）
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-star-dim">
          {magnification && (
            <span className="rounded bg-space-700 px-2 py-0.5">放大 {magnification}</span>
          )}
          {afterLabel && (
            <span className="rounded bg-space-700 px-2 py-0.5">增强后 {afterLabel}</span>
          )}
        </div>
      </div>

      {/* 查看器 */}
      <div
        ref={containerRef}
        className="relative h-[70vh] max-h-[560px] w-full cursor-crosshair overflow-hidden rounded-xl border border-space-700 bg-black"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        style={{ touchAction: 'none' }}
      >
        {/* 增强后（底层） */}
        <div
          className="absolute inset-0"
          style={{
            transform: mode === 'zoom' ? `translate(${pan.x}px,${pan.y}px) scale(${zoom})` : undefined,
            transformOrigin: 'top left',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={afterUrl} alt="增强后" className="h-full w-full object-contain" draggable={false} />
        </div>

        {/* 对比模式：原图覆盖层 + 裁剪 */}
        {mode === 'compare' && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={beforeUrl} alt="原图" className="h-full w-full object-contain" draggable={false} />
            {/* 左侧标签 */}
            <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
              原图
            </span>
            <span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
              增强后
            </span>
          </div>
        )}

        {/* 对比分割线 */}
        {mode === 'compare' && (
          <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
            <div className="absolute inset-y-0 -ml-px w-0.5 bg-white/80" />
            <div className="absolute top-1/2 -ml-3 -mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-space-900 shadow">
              ⟷
            </div>
          </div>
        )}

        {/* 放大模式提示 */}
        {mode === 'zoom' && (
          <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
            {zoom.toFixed(1)}x（滚轮缩放 · 拖动平移）
          </div>
        )}
      </div>
    </div>
  )
}