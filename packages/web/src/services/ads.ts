import apiClient from '@/lib/api'

/* 前端广告类型（与后端 Ad 实体对应） */
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
  createdAt: string
  updatedAt: string
}

/** 首页广告最大展示数量 */
export const MAX_ADS = 5

/** 创建/更新广告的数据结构 */
export interface AdFormData {
  title: string
  desc: string
  img: string
  href?: string
  address?: string
  lng?: number
  lat?: number
  active?: boolean
}

/* 获取启用的广告（公开接口，首页侧边栏使用） */
export async function getActiveAds(): Promise<AdItem[]> {
  const { data } = await apiClient.get<AdItem[]>('/ads')
  return data || []
}

/* 获取全部广告（管理后台使用） */
export async function getAllAds(): Promise<AdItem[]> {
  const { data } = await apiClient.get<AdItem[]>('/ads/all')
  return data || []
}

/* 创建广告 */
export async function createAd(ad: AdFormData): Promise<AdItem> {
  const { data } = await apiClient.post<AdItem>('/ads', ad)
  return data
}

/* 更新广告 */
export async function updateAd(id: string, patch: Partial<AdFormData>): Promise<AdItem> {
  const { data } = await apiClient.put<AdItem>(`/ads/${id}`, patch)
  return data
}

/* 删除广告 */
export async function deleteAd(id: string): Promise<void> {
  await apiClient.delete(`/ads/${id}`)
}

/* 重置为默认广告 */
export async function resetAds(): Promise<void> {
  await apiClient.post('/ads/reset')
}
