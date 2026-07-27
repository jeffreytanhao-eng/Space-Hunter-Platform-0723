'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { Flame, Megaphone } from 'lucide-react'

/* 侧边栏：热门标签 + 赞助商广告 */
/* 说明：板块导航已与顶部导航栏统一（顶部 URL 驱动），侧边栏不再重复，改为聚焦标签筛选与商业广告 */
export function Sidebar() {
  const { t } = useTranslation()

  /* 热门标签（后续从 API 获取，暂用占位数据） */
  const hotTags = [
    { name: '深空天体', count: 128 },
    { name: '行星摄影', count: 96 },
    { name: '星野摄影', count: 85 },
    { name: '望远镜', count: 72 },
    { name: 'FITS处理', count: 64 },
    { name: '日食', count: 53 },
    { name: '流星雨', count: 47 },
    { name: '深空合成', count: 39 },
  ]

  /* 赞助商广告位（天文观测望远镜 / 摄影器材） */
  const ads = [
    {
      title: '星达 EQ6R Pro 赤道仪',
      desc: '深空摄影旗舰之选 · 承重 20kg',
      href: '#',
      img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20astronomical%20reflector%20telescope%20on%20mountain%20observatory%20under%20Milky%20Way%2C%20deep%20blue%20cyan%20neon%20glow%2C%20futuristic%20tech%20product%20advertisement%2C%20no%20text&image_size=portrait_4_3',
    },
    {
      title: 'ZWO ASI2600MM Pro',
      desc: '制冷黑白天文相机 · 深空利器',
      href: '#',
      img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Premium%20astrophotography%20monochrome%20CMOS%20camera%20product%20showcase%2C%20dark%20space%20background%20with%20stars%2C%20purple%20blue%20neon%20accent%2C%20tech%20advertisement%2C%20no%20text&image_size=portrait_4_3',
    },
  ]

  return (
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
                key={tag.name}
                href={`/?tag=${encodeURIComponent(tag.name)}`}
                className="rounded-full bg-space-700 px-2.5 py-1 text-xs text-star-dim hover:bg-neon-cyan/10 hover:text-neon-cyan transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>

        {/* 赞助商广告 */}
        <div className="rounded-xl border-glow-purple bg-space-800 p-3">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-star-white">
            <Megaphone className="h-4 w-4 text-neon-purple" />
            赞助商
          </h3>
          <div className="space-y-3">
            {ads.map((ad) => (
              <Link
                key={ad.title}
                href={ad.href}
                className="group block overflow-hidden rounded-lg border border-space-600 bg-space-700 transition-all hover:border-neon-purple/50 hover:shadow-lg hover:shadow-neon-purple/10"
              >
                <div className="aspect-[4/3] overflow-hidden bg-space-900">
                  <img
                    src={ad.img}
                    alt={ad.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-medium text-star-white group-hover:text-neon-purple transition-colors line-clamp-1">
                    {ad.title}
                  </p>
                  <p className="mt-0.5 text-xs text-star-dim line-clamp-1">{ad.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
