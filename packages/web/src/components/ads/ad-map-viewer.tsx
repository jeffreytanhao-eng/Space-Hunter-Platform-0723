'use client'

/**
 * 广告地图查看器
 *
 * 使用高德 JS API 2.0 直接在弹窗内渲染地图，
 * 替代 iframe 嵌入 uri.amap.com，避免弹出登录/下载引导。
 *
 * 特性：
 * - 有经纬度时直接标记精确位置
 * - 仅有地址时通过地理编码查询坐标后标记
 * - 暗色主题适配项目 UI
 * - 只读展示，无登录要求
 */

import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { loadAMap } from '@/lib/amap-loader'

interface AdMapViewerProps {
  /** 广告标题（用作标记名称） */
  title: string
  /** 地址文字 */
  address?: string | null
  /** 经度 */
  lng?: number | null
  /** 纬度 */
  lat?: number | null
}

export function AdMapViewer({ title, address, lng, lat }: AdMapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    loadAMap(['AMap.Geocoder'])
      .then(() => {
        if (cancelled || !containerRef.current || !window.AMap) return
        initMap()
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || '地图加载失败')
        setLoading(false)
      })

    function initMap() {
      if (!containerRef.current || !window.AMap) return

      // 默认中心：中国中心
      const defaultCenter: [number, number] = [104.0, 35.0]

      const map = new window.AMap.Map(containerRef.current, {
        zoom: 5,
        center: defaultCenter,
        viewMode: '2D',
        mapStyle: 'amap://styles/dark',
        resizeEnable: true,
      })
      mapRef.current = map

      // 有精确坐标：直接标记
      if (lng !== null && lng !== undefined && lat !== null && lat !== undefined) {
        placeMarker(map, lng, lat)
        map.setZoomAndCenter(15, [lng, lat])
        setLoading(false)
        return
      }

      // 仅有地址：地理编码查询坐标
      if (address) {
        const geocoder = new window.AMap.Geocoder({ city: '全国' })
        geocoder.getLocation(address, (status: string, result: any) => {
          if (cancelled) return

          if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
            const geo = result.geocodes[0]
            const glng = geo.location.lng
            const glat = geo.location.lat
            placeMarker(map, glng, glat)
            map.setZoomAndCenter(15, [glng, glat])
          } else {
            // 地理编码失败，显示全国视图
            map.setZoom(4)
            setError('无法精确定位，已显示全国地图')
          }
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
      markerRef.current = null
    }
  }, [title, address, lng, lat])

  /* 在地图上放置标记 */
  function placeMarker(map: any, mlng: number, mlat: number) {
    if (!window.AMap) return

    if (markerRef.current) {
      map.remove(markerRef.current)
    }

    // 使用信息窗体显示标题
    const infoWindow = new window.AMap.InfoWindow({
      content: `<div style="padding:4px 8px;font-size:13px;color:#fff;background:transparent;">${title}</div>`,
      offset: new window.AMap.Pixel(0, -32),
      closeWhenClickMap: false,
    })

    const marker = new window.AMap.Marker({
      position: [mlng, mlat],
      title,
      anchor: 'bottom-center',
    })

    marker.on('click', () => {
      infoWindow.open(map, marker.getPosition())
    })

    map.add(marker)
    markerRef.current = marker

    // 默认打开信息窗体
    infoWindow.open(map, [mlng, mlat])
  }

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-space-900">
      <div ref={containerRef} className="h-full w-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-space-900/80">
          <Loader2 className="h-6 w-6 animate-spin text-neon-cyan" />
          <span className="ml-2 text-sm text-star-dim">地图加载中...</span>
        </div>
      )}

      {error && !loading && (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/60 px-3 py-1.5 text-xs text-amber-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
