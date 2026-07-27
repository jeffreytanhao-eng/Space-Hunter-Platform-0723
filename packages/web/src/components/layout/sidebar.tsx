﻿﻿﻿﻿﻿﻿'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getSections } from '@/services/sections'
import { useTranslation } from '@/lib/i18n'
import { Hash, Flame } from 'lucide-react'

/* 侧边栏：板块列表 + 热门标签 */
export function Sidebar() {
  const { t } = useTranslation()
  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: getSections,
  })

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

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-14 space-y-4 p-4">
        {/* 板块列表 */}
        <div className="rounded-xl border-glow-purple bg-space-800 p-3">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-star-white">
            <Hash className="h-4 w-4 text-neon-purple" />
            {t('sidebar.sectionNav')}
          </h3>
          <nav className="space-y-0.5">
            {sections ? (
              sections.map((section) => (
                <Link
                  key={section.id}
                  href={`/?sectionId=${section.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-star-dim hover:bg-space-700 hover:text-star-white transition-colors"
                >
                  <span>{section.name}</span>
                  <span className="text-xs text-star-dim/60">{section.postsCount}</span>
                </Link>
              ))
            ) : (
              /* 骨架屏 */
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-space-700" />
              ))
            )}
          </nav>
        </div>

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
      </div>
    </aside>
  )
}
