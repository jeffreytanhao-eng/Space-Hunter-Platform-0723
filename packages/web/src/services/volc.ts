import apiClient from '@/lib/api'

/* 提取后端返回的具体错误信息 */
function extractError(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } }; message?: string }
  const msg = e?.response?.data?.message
  if (Array.isArray(msg)) return msg[0] || '请求失败'
  if (typeof msg === 'string') return msg
  return e?.message || '请求失败'
}

/** 上传本地图片到火山，返回 mediakit://file_id */
export async function volcUpload(file: Blob | File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  try {
    const { data } = await apiClient.post('/volc/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return data.fileId
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** 提交图像画质增强任务（同步接口，返回增强后图片 URL，24h 有效） */
export async function volcEnhance(params: {
  imageUrl: string
  toolVersion: string
  multiple?: number
  targetWidth?: number
  targetHeight?: number
}) {
  try {
    const { data } = await apiClient.post('/volc/enhance', params, {
      timeout: 120000,
    })
    return data.result
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** veImageX AIGC 大模型超分（最高 30x） */
export async function volcAiUpscale(params: {
  imageUrl: string
  multiple?: number
}) {
  try {
    const { data } = await apiClient.post('/volc/ai-upscale', params, {
      timeout: 180000,
    })
    return data.result
  } catch (err) {
    throw new Error(extractError(err))
  }
}