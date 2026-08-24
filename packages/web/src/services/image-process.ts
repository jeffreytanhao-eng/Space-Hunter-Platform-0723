import apiClient from '@/lib/api'

/** 处理任务状态 */
export interface ProcessJob {
  id: string
  sessionId: string
  originalPath: string
  originalName: string
  originalSize: number
  originalWidth: number
  originalHeight: number
  channelAPath: string | null
  channelASize: number | null
  channelAWidth: number | null
  channelAHeight: number | null
  channelAParams: Record<string, any> | null
  channelAStatus: string
  channelAError: string | null
  channelBPath: string | null
  channelBSize: number | null
  channelBWidth: number | null
  channelBHeight: number | null
  channelBParams: Record<string, any> | null
  channelBStatus: string
  channelBError: string | null
  createdAt: string
  updatedAt: string
}

/** 上传图片并执行双通道/单通道增强 */
export async function processImage(params: {
  file: File
  mode?: 'A' | 'B' | 'both'
  styleA?: 'classic' | 'smart'
  beta?: number
  residualRef?: number
  stretch?: string
  zscaleContrast?: number
  asinhA?: number
  boxSize?: number
  enableCosmics?: boolean
  cosmicsSigclip?: number
  cosmicsObjlim?: number
  style?: string
  intensity?: number
}): Promise<ProcessJob> {
  const form = new FormData()
  form.append('file', params.file)
  if (params.mode) form.append('mode', params.mode)
  if (params.styleA) form.append('styleA', params.styleA)
  if (params.beta !== undefined) form.append('beta', String(params.beta))
  if (params.residualRef !== undefined) form.append('residualRef', String(params.residualRef))
  if (params.stretch) form.append('stretch', params.stretch)
  if (params.zscaleContrast !== undefined) form.append('zscaleContrast', String(params.zscaleContrast))
  if (params.asinhA !== undefined) form.append('asinhA', String(params.asinhA))
  if (params.boxSize !== undefined) form.append('boxSize', String(params.boxSize))
  if (params.enableCosmics !== undefined) form.append('enableCosmics', params.enableCosmics ? '1' : '0')
  if (params.cosmicsSigclip !== undefined) form.append('cosmicsSigclip', String(params.cosmicsSigclip))
  if (params.cosmicsObjlim !== undefined) form.append('cosmicsObjlim', String(params.cosmicsObjlim))
  if (params.style) form.append('style', params.style)
  if (params.intensity !== undefined) form.append('intensity', String(params.intensity))

  const { data } = await apiClient.post('/image-process/process', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
  return data.job
}

/** 查询任务状态 */
export async function getJob(jobId: string): Promise<ProcessJob> {
  const { data } = await apiClient.get(`/image-process/jobs/${jobId}`)
  return data.job
}

/** 轮询任务直到完成或失败 */
export async function pollJob(
  jobId: string,
  onUpdate?: (job: ProcessJob) => void,
  intervalMs = 2000,
  maxMs = 120000,
): Promise<ProcessJob> {
  const start = Date.now()
  while (true) {
    const job = await getJob(jobId)
    onUpdate?.(job)
    const aDone = ['done', 'failed', 'skipped'].includes(job.channelAStatus)
    const bDone = ['done', 'failed', 'skipped'].includes(job.channelBStatus)
    if (aDone && bDone) return job
    if (Date.now() - start > maxMs) throw new Error('处理超时')
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

/** 获取历史记录（全局共享） */
export async function getHistory(
  page = 1,
  pageSize = 20,
): Promise<{ data: ProcessJob[]; total: number }> {
  const { data } = await apiClient.get('/image-process/history', {
    params: { page, pageSize },
  })
  return data
}

/** 删除历史记录 */
export async function deleteJob(id: string): Promise<void> {
  await apiClient.delete(`/image-process/${id}`)
}
