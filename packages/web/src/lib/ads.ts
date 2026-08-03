/**
 * 广告辅助函数（类型、地图工具）
 *
 * 广告数据通过后端 API 存储（/api/ads），前端通过 services/ads.ts 调用。
 * 此文件仅保留类型定义和地图相关的纯函数工具。
 */

/** 广告项类型（与后端 Ad 实体对应） */
export interface AdItem {
  id: string
  title: string
  desc: string
  img: string
  href?: string | null
  address?: string | null
  lng?: number | null
  lat?: number | null
  active: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

/** 首页广告最大展示数量 */
export const MAX_ADS = 5

/* 判断广告是否有地图信息（只要有地址即显示地图按钮） */
export function hasMap(ad: AdItem): boolean {
  return !!ad.address
}

/**
 * 生成高德地图 URI（免 key，可在 iframe 中嵌入）
 * - 有经纬度：使用 marker 接口精确定位标记
 * - 仅有地址：使用 search 接口按关键字搜索展示
 */
export function getAmapUrl(ad: AdItem): string {
  if (!hasMap(ad)) return ''

  // 有经纬度：精确定位
  if (ad.lng != null && ad.lat != null) { // eslint-disable-line eqeqeq
    const params = new URLSearchParams({
      position: `${ad.lng},${ad.lat}`,
      name: ad.title,
      coordinate: 'gaode',
      callnative: '1',
      src: 'spacehuntter',
    })
    return `https://uri.amap.com/marker?${params.toString()}`
  }

  // 仅有地址：按关键字搜索
  const params = new URLSearchParams({
    keyword: ad.address!,
    src: 'spacehuntter',
  })
  return `https://uri.amap.com/search?${params.toString()}`
}

/* 判断广告是否有精确坐标（用于决定是否显示导航按钮） */
export function hasCoordinates(ad: AdItem): boolean {
  return ad.lng != null && ad.lat != null // eslint-disable-line eqeqeq
}
