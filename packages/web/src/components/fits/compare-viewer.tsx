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
 *
 * 性能优化要点：
 * 1. 对比模式使用 overflow:hidden + 宽度变化 代替 clipPath，减少重绘开销
 * 2. 滑块位置用 ref + 原生 DOM 操作，绕过 React state 重渲染
 * 3. pointermove 通过 requestAnimationFrame 节流，匹配屏幕刷新率
 * 4. will-change 提示浏览器创建合成层
 */
export default function CompareViewer({
  beforeUrl,
  afterUrl,
  afterLabel,
  magnification,
}: CompareViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // 对比裁剪层（before-wrapper）
  const clipRef = useRef<HTMLDivElement>(null)
  // 分割线
  const dividerRef = useRef<HTMLDivElement>(null)
  // 滑块位置（ref 存储，不触发 React 重渲染）
  const posRef = useRef(50)
  // rAF 节流 id
  const rafIdRef = useRef<number | null>(null)
  // 最新的 clientX（rAF 回调中使用）
  const pendingClientX = useRef<number | null>(null)

  /* 放大模式仍用 state（更新频率低） */
  const [mode, setMode] = useState<'compare' | 'zoom'>('compare')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  /** 直接操作 DOM 更新滑块位置，不走 React */
  const applySliderPos = useCallback((pct: number) => {
    posRef.current = pct
    if (clipRef.current) {
      // 用 clip-path 裁剪 before 层：只显示左侧 pct% 区域。
      // before 图本身保持容器全尺寸不缩放，与底层 after 完全对齐。
      clipRef.current.style.clipPath = `inset(0 ${100 - pct}% 0 0)`
    }
    if (dividerRef.current) {
      // 用 left 定位（相对容器宽度），不能用 translateX（相对自身宽度，约0）
      dividerRef.current.style.left = `${pct}%`
      dividerRef.current.style.transform = `translateX(-50%)`
    }
  }, [])

  /** 根据 clientX 计算百分比并通过 rAF 更新 */
  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    pendingClientX.current = null

    if (rafIdRef.current !== null) return
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null
      // 如果在 rAF 等待期间又有新的事件，用最新的位置
      if (pendingClientX.current !== null) {
        const latestX = pendingClientX.current
        pendingClientX.current = null
        const latestRect = el.getBoundingClientRect()
        if (latestRect.width > 0) {
          const latestPct = Math.min(
            100,
            Math.max(0, ((latestX - latestRect.left) / latestRect.width) * 100),
          )
          applySliderPos(latestPct)
          return
        }
      }
      applySliderPos(pct)
    })
  }, [applySliderPos])

  /* 初始化：设置滑块初始位置 */
  useEffect(() => {
    applySliderPos(posRef.current)
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [applySliderPos])

  /* 图片 URL 变化时强制重新应用滑块位置（切换历史记录场景） */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      applySliderPos(posRef.current)
    })
    return () => cancelAnimationFrame(raf)
  }, [beforeUrl, afterUrl, applySliderPos])

  /* 切换模式时重置缩放/平移 */
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [mode])

  /* 切换模式时同步滑块位置（mode 变化可能导致 DOM 重建） */
  useEffect(() => {
    if (mode === 'compare') {
      // 下一帧应用位置，确保 DOM 已挂载
      requestAnimationFrame(() => {
        applySliderPos(posRef.current)
      })
    }
  }, [mode, applySliderPos])

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
      pendingClientX.current = e.clientX
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
          className="absolute inset-0 will-change-transform"
          style={{
            transform: mode === 'zoom' ? `translate(${pan.x}px,${pan.y}px) scale(${zoom})` : undefined,
            transformOrigin: 'top left',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={afterUrl}
            alt="增强后"
            decoding="async"
            className="h-full w-full object-contain select-none"
            draggable={false}
          />
        </div>

        {/* 对比模式：原图裁剪层（clip-path 裁剪，before 图保持全尺寸不缩放，与 after 完全对齐） */}
        {mode === 'compare' && (
          <div
            ref={clipRef}
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ clipPath: 'inset(0 50% 0 0)', willChange: 'clip-path' }}
          >
            {/* before 图与 after 完全相同的尺寸定位，保证像素级对齐 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={beforeUrl}
              alt="原图"
              decoding="async"
              className="h-full w-full object-contain select-none"
              draggable={false}
            />
            {/* 左侧标签 */}
            <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
              原图
            </span>
          </div>
        )}

        {/* 右侧"增强后"标签（固定在右上角，不随裁剪变化） */}
        {mode === 'compare' && (
          <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
            增强后
          </span>
        )}

        {/* 对比分割线 */}
        {mode === 'compare' && (
          <div
            ref={dividerRef}
            className="pointer-events-none absolute inset-y-0 left-0"
            style={{ willChange: 'transform' }}
          >
            <div className="absolute inset-y-0 -ml-px w-0.5 bg-white/80" />
            <div className="absolute top-1/2 left-0 -ml-3 -mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-space-900 shadow">
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