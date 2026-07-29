'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { Flame, Megaphone, MapPin, X, Navigation, ExternalLink } from 'lucide-react'
import { hasMap, hasCoordinates, type AdItem } from '@/lib/ads'
import { getActiveAds, MAX_ADS } from '@/services/ads'
import { AdMapViewer } from '@/components/ads/ad-map-viewer'

/* 侧边栏：热门标签 + 赞助商广告 */
export function Sidebar() {
  const { t } = useTranslation()
  const [ads, setAds] = useState<AdItem[]>([])
  const [mapAd, setMapAd] = useState<AdItem | null>(null)

  useEffect(() => {
    getActiveAds()
      .then((data) => setAds(data))
      .catch((err) => {
        console.error('加载广告失败:', err)
        setAds([])
      })
  }, [])

  const hotTags = [
    { id: 'deep_sky', name: '深空天体', count: 128 },
    { id: 'planetary', name: '行星摄影', count: 96 },
    { id: 'starfield', name: '星野摄影', count: 85 },
    { id: 'telescope', name: '望远镜', count: 72 },
    { id: 'fits', name: 'FITS处理', count: 64 },
    { id: 'solar_eclipse', name: '日食', count: 53 },
    { id: 'meteor_shower', name: '流星雨', count: 47 },
    { id: 'deep_sky_stack', name: '深空合成', count: 39 },
  ]

  /* 标签显示名：查 i18n 词典，查不到则 fallback 到原始中文名 */
  const tagName = (tag: { id: string; name: string }) => {
    const key = `tags.${tag.id}`
    const translated = t(key)
    return translated === key ? tag.name : translated
  }

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-14 space-y-4 p-4">
          {/* 热门标签 */}
          <div className="rounded-xl border-glow-cyan bg-space-800 p-3">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-star-white">
              <Flame className="h-4 w-4 text-neon-cyan" />
              {t('sidebar.hotTags')}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {hotTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/?tag=${encodeURIComponent(tag.name)}`}
                  className="rounded-full bg-space-700 px-2.5 py-1 text-xs text-star-dim hover:bg-neon-cyan/10 hover:text-neon-cyan transition-colors"
                >
                  {tagName(tag)}
                </Link>
              ))}
            </div>
          </div>

          {/* 赞助商广告（最多 MAX_ADS 个） */}
          <div className="rounded-xl border-glow-purple bg-space-800 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-medium text-star-white">
                <Megaphone className="h-4 w-4 text-neon-purple" />
                {t('sidebar.sponsors')}
              </h3>
              <span className="text-xs text-star-dim/50">{ads.length}/{MAX_ADS}</span>
            </div>
            <div className="space-y-3">
              {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} onShowMap={() => setMapAd(ad)} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* 地图弹窗 */}
      {mapAd && <MapModal ad={mapAd} onClose={() => setMapAd(null)} />}
    </>
  )
}

/* 统一广告卡片：图片用 object-cover 裁剪（保持长宽比），有链接可跳转，有地址可看地图 */
function AdCard({ ad, onShowMap }: { ad: AdItem; onShowMap: () => void }) {
  const { t } = useTranslation()
  const showMap = hasMap(ad)

  /* 卡片内容 */
  const content = (
    <div className="group block overflow-hidden rounded-lg border border-space-600 bg-space-700 transition-all hover:border-neon-cyan/50 hover:shadow-lg hover:shadow-neon-cyan/10">
      {/* 图片：object-cover 自动裁剪以适应 4:3 比例，不改变长宽比 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-space-900">
        <img
          src={ad.img}
          alt={ad.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        {ad.href && (
          <div className="absolute right-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      {/* 文字信息 */}
      <div className="p-2.5">
        <p className="text-sm font-medium text-star-white group-hover:text-neon-cyan transition-colors line-clamp-1">
          {ad.title}
        </p>
        <p className="mt-0.5 text-xs text-star-dim line-clamp-1">{ad.desc}</p>
        {ad.address && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-star-dim/70 line-clamp-1">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            {ad.address}
          </p>
        )}
      </div>
    </div>
  )

  /* 有链接则用 <a> 包裹整个卡片；无链接则用 <div> */
  const wrapper = ad.href ? (
    <a href={ad.href} target="_blank" rel="noopener noreferrer" className="block">{content}</a>
  ) : (
    <div>{content}</div>
  )

  /* 有地图信息则在卡片下方加「查看地图」按钮 */
  if (!showMap) return wrapper

  return (
    <div>
      {wrapper}
      <button
        onClick={onShowMap}
        className="mt-1 flex w-full items-center justify-center gap-1 rounded-md bg-neon-cyan/10 py-1 text-xs text-neon-cyan transition-colors hover:bg-neon-cyan/20"
      >
        <MapPin className="h-3 w-3" />
        {t('sidebar.viewMap')}
      </button>
    </div>
  )
}

/* 地图模态框：使用高德 JS API 内嵌地图，无登录/下载弹窗 */
function MapModal({ ad, onClose }: { ad: AdItem; onClose: () => void }) {
  const { t } = useTranslation()
  /* 生成高德导航链接（新标签页打开，由用户主动跳转） */
  const navUrl = hasCoordinates(ad)
    ? `https://uri.amap.com/navigation?to=${ad.lng},${ad.lat},${encodeURIComponent(ad.title)}&mode=car&coordinate=gaode&callnative=1&src=spacehuntter`
    : ad.address
      ? `https://uri.amap.com/search?keyword=${encodeURIComponent(ad.address)}&src=spacehuntter`
      : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-space-600 bg-space-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-space-600 p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-neon-cyan" />
            <div>
              <h3 className="text-base font-semibold text-star-white">{ad.title}</h3>
              {ad.address && <p className="text-xs text-star-dim">{ad.address}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-star-dim transition-colors hover:bg-space-700 hover:text-star-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内嵌高德地图（JS API 直接渲染，无 iframe 登录弹窗） */}
        <div className="p-3">
          {hasMap(ad) ? (
            <AdMapViewer
              title={ad.title}
              address={ad.address}
              lng={ad.lng}
              lat={ad.lat}
            />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center rounded-lg bg-space-900 text-sm text-star-dim">
              {t('sidebar.noLocation')}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between border-t border-space-600 px-4 py-3">
          {hasCoordinates(ad) ? (
            <p className="text-xs text-star-dim">
              {t('sidebar.coordinates', { lng: ad.lng?.toFixed(4) ?? '-', lat: ad.lat?.toFixed(4) ?? '-' })}
            </p>
          ) : (
            <p className="text-xs text-star-dim">{t('sidebar.address', { addr: ad.address || '-' })}</p>
          )}
          {navUrl && (
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20"
            >
              <Navigation className="h-3.5 w-3.5" />
              {hasCoordinates(ad) ? t('sidebar.navigate') : t('sidebar.openInAmap')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
