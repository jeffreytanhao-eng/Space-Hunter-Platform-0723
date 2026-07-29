'use client'

/**
 * 高德地图地址选择器
 *
 * 功能：
 * 1. 关键字搜索 POI（点兴趣），结果以列表展示
 * 2. 点击列表项在地图上标记位置
 * 3. 点击地图任意位置，逆地理编码获取地址
 * 4. 确认后将地址 + 经纬度回传给父组件
 *
 * 使用高德 JS API 2.0，需要 Key + 安全密钥
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, MapPin, Loader2, Check } from 'lucide-react'
import { loadAMap } from '@/lib/amap-loader'

/* POI 搜索结果项 */
interface PoiResult {
  id: string
  name: string
  address: string
  location: { lng: number; lat: number }
}

/* 选择结果回传给父组件 */
export interface AddressSelectResult {
  address: string
  lng: number
  lat: number
  name: string
}

interface AddressPickerProps {
  initialAddress?: string
  onSelect: (result: AddressSelectResult) => void
  onClose: () => void
}

export function AddressPicker({ initialAddress, onSelect, onClose }: AddressPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const placeSearchRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [keyword, setKeyword] = useState(initialAddress || '')
  const [results, setResults] = useState<PoiResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<PoiResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /* 初始化地图 */
  useEffect(() => {
    let cancelled = false

    loadAMap()
      .then(() => {
        if (cancelled || !mapContainerRef.current || !window.AMap) return

        const map = new window.AMap.Map(mapContainerRef.current, {
          zoom: 5,
          center: [104.0, 35.0], // 中国中心
          viewMode: '2D',
          mapStyle: 'amap://styles/dark', // 暗色主题适配
        })
        mapRef.current = map

        // 初始化搜索 & 逆地理编码
        placeSearchRef.current = new window.AMap.PlaceSearch({
          pageSize: 20,
          pageIndex: 1,
          city: '全国',
        })
        geocoderRef.current = new window.AMap.Geocoder()

        // 点击地图选点
        map.on('click', (e: any) => {
          const lng = e.lnglat.getLng()
          const lat = e.lnglat.getLat()
          placeMarker(lng, lat)

          // 逆地理编码获取地址
          geocoderRef.current.getAddress([lng, lat], (status: string, result: any) => {
            if (status === 'complete' && result.regeocode) {
              const addr = result.regeocode.formattedAddress || ''
              setSelected({
                id: `click-${Date.now()}`,
                name: addr || '自定义位置',
                address: addr,
                location: { lng, lat },
              })
            } else {
              setSelected({
                id: `click-${Date.now()}`,
                name: '自定义位置',
                address: `${lng.toFixed(4)}, ${lat.toFixed(4)}`,
                location: { lng, lat },
              })
            }
          })
        })

        setLoading(false)

        // 有初始地址则自动搜索
        if (initialAddress) {
          doSearch(initialAddress)
        }
      })
      .catch((err) => {
        setError('地图加载失败: ' + (err.message || '未知错误'))
        setLoading(false)
      })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* 在地图上放置/移动标记 */
  const placeMarker = useCallback((lng: number, lat: number) => {
    if (!mapRef.current || !window.AMap) return

    if (markerRef.current) {
      mapRef.current.remove(markerRef.current)
    }

    const marker = new window.AMap.Marker({
      position: [lng, lat],
    })
    mapRef.current.add(marker)
    markerRef.current = marker
    mapRef.current.setZoomAndCenter(15, [lng, lat])
  }, [])

  /* 搜索 POI */
  const doSearch = useCallback(
    (kw: string) => {
      const query = kw.trim()
      if (!query || !placeSearchRef.current) return

      setSearching(true)
      setResults([])
      setSelected(null)

      placeSearchRef.current.search(query, (status: string, result: any) => {
        setSearching(false)
        if (status === 'complete' && result.poiList && result.poiList.pois) {
          const pois: PoiResult[] = result.poiList.pois.map((poi: any) => ({
            id: poi.id,
            name: poi.name,
            address: poi.address || poi.name,
            location: { lng: poi.location.lng, lat: poi.location.lat },
          }))
          setResults(pois)
          // 自动展示第一个结果
          if (pois.length > 0) {
            selectPoi(pois[0])
          }
        } else {
          setResults([])
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  /* 选中某个 POI：在地图标记并更新 selected */
  const selectPoi = useCallback(
    (poi: PoiResult) => {
      setSelected(poi)
      placeMarker(poi.location.lng, poi.location.lat)
    },
    [placeMarker],
  )

  /* 确认选择 */
  const handleConfirm = () => {
    if (!selected) return
    onSelect({
      address: selected.address || selected.name,
      lng: selected.location.lng,
      lat: selected.location.lat,
      name: selected.name,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-space-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-space-600 p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-star-white">
            <MapPin className="h-5 w-5 text-neon-cyan" />
            选择地址
          </h2>
          <button onClick={onClose} className="text-star-dim hover:text-star-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="border-b border-space-600 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') doSearch(keyword)
              }}
              placeholder="输入地址关键字搜索（如：青海冷湖、阿里暗夜公园）"
              className="flex-1 rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-sm text-star-white placeholder:text-star-dim/50 focus:border-neon-blue focus:outline-none"
            />
            <button
              onClick={() => doSearch(keyword)}
              disabled={searching}
              className="inline-flex items-center gap-1 rounded-lg bg-neon-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neon-blue/80 disabled:opacity-50"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              搜索
            </button>
          </div>
        </div>

        {/* 内容区：地图 + 结果列表 */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: '350px' }}>
          {/* 地图 */}
          <div className="relative flex-1 bg-space-900">
            <div ref={mapContainerRef} className="h-full w-full" />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-space-900">
                <Loader2 className="h-6 w-6 animate-spin text-neon-blue" />
                <span className="ml-2 text-sm text-star-dim">地图加载中...</span>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-red-400">
                {error}
              </div>
            )}
            {!loading && !error && (
              <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-star-dim">
                💡 也可以直接点击地图选择位置
              </div>
            )}
          </div>

          {/* 搜索结果列表 */}
          <div className="w-64 shrink-0 overflow-y-auto border-l border-space-600 bg-space-800">
            {searching ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-neon-blue" />
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-sm text-star-dim">
                {keyword ? '暂无搜索结果' : '请输入关键字搜索，或直接点击地图'}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {results.map((poi) => (
                  <button
                    key={poi.id}
                    onClick={() => selectPoi(poi)}
                    className={`block w-full rounded-lg border p-2 text-left transition-colors ${
                      selected?.id === poi.id
                        ? 'border-neon-blue/50 bg-neon-blue/20'
                        : 'border-transparent hover:bg-space-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                          selected?.id === poi.id ? 'text-neon-blue' : 'text-neon-cyan'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-star-white">{poi.name}</p>
                        {poi.address && poi.address !== poi.name && (
                          <p className="truncate text-xs text-star-dim">{poi.address}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between gap-2 border-t border-space-600 p-3">
          {selected ? (
            <p className="min-w-0 flex-1 truncate text-xs text-star-dim">
              <span className="text-neon-cyan">已选择：</span>
              {selected.name}
              {selected.address && selected.address !== selected.name && (
                <span className="ml-1 text-star-dim/70">— {selected.address}</span>
              )}
            </p>
          ) : (
            <p className="text-xs text-star-dim/50">请搜索或在地图上点击选择地址</p>
          )}
          <div className="flex shrink-0 gap-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-space-700 px-4 py-1.5 text-sm text-star-dim transition-colors hover:bg-space-600"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="inline-flex items-center gap-1 rounded-lg bg-neon-blue px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neon-blue/80 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
