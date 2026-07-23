import apiClient from '@/lib/api'
import type { Section, RequestSectionData } from '@/types'

/* 板块相关 API */

/** 获取板块列表 */
export async function getSections() {
  const { data } = await apiClient.get<Section[]>('/sections')
  return data
}

/** 申请板块 */
export async function requestSection(reqData: RequestSectionData) {
  const { data } = await apiClient.post('/sections/request', reqData)
  return data
}
