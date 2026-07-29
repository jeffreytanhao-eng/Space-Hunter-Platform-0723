/**
 * 高德地图 JS API 共享加载器
 *
 * 单例模式，确保高德脚本在整个应用中只加载一次，
 * 无论是在地址选择器还是广告地图弹窗中使用。
 */

/* 高德地图配置（Web端 JS API Key，客户端可见，属正常） */
const AMAP_KEY = '92a9d65bb6d3cf785928892343849ae5'
const AMAP_SECURITY_CODE = 'd76e109248c129f5fc39c1497379bb26'

/* 全局类型声明 */
declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string }
    AMap?: any
  }
}

/* 单例状态 */
let amapLoaded = false
let amapLoadPromise: Promise<void> | null = null

/**
 * 加载高德地图 JS API
 * 多次调用只会加载一次，返回同一个 Promise
 */
export function loadAMap(plugins: string[] = ['AMap.PlaceSearch', 'AMap.Geocoder']): Promise<void> {
  if (amapLoaded && window.AMap) return Promise.resolve()
  if (amapLoadPromise) return amapLoadPromise

  amapLoadPromise = new Promise<void>((resolve, reject) => {
    // 安全密钥必须在脚本加载前设置
    window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE }

    const pluginStr = plugins.length > 0 ? `&plugin=${plugins.join(',')}` : ''
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}${pluginStr}`
    script.async = true
    script.onload = () => {
      amapLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('高德地图脚本加载失败，请检查网络连接'))
    document.head.appendChild(script)
  })

  return amapLoadPromise
}
