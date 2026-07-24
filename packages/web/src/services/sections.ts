import apiClient from '@/lib/api'
import type { Section, RequestSectionData } from '@/types'

/* 后端返回的板块类型 */
interface BackendSection {
  id: string
  name: string
  description: string | null
  icon: string | null
  sortOrder: number
  status: string
  postCount: number
  createdAt: string
}

/* 转换后端板块格式到前端格式 */
function transformSection(bs: BackendSection): Section {
  return {
    id: bs.id,
    name: bs.name,
    description: bs.description || undefined,
    icon: bs.icon || undefined,
    postsCount: bs.postCount,
    createdAt: bs.createdAt,
  }
}

/* 板块相关 API */

/** 获取板块列表 */
export async function getSections() {
  const { data } = await apiClient.get<BackendSection[]>('/sections')
  return data.map(transformSection)
}

/** 申请板块 */
export async function requestSection(reqData: RequestSectionData) {
  const { data } = await apiClient.post('/sections/request', reqData)
  return data
}
