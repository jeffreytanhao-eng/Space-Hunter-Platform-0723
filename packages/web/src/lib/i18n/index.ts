import { zh } from './zh'
import { en } from './en'
import { useLocaleStore } from '@/stores/locale-store'

export type TranslationKey = keyof typeof zh

type DeepValue<T, K extends string> = K extends `${infer A}.${infer B}`
  ? A extends keyof T
    ? DeepValue<T[A], B>
    : string
  : K extends keyof T
    ? T[K]
    : string

const translations = { zh, en } as const

function getValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let result: unknown = obj
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return typeof result === 'string' ? result : path
}

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale)
  const dict = translations[locale]

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = getValue(dict as unknown as Record<string, unknown>, key)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v))
      })
    }
    return text
  }

  const localeText = locale === 'zh' ? 'zh' : 'en'

  return { t, locale, localeText, dict }
}
