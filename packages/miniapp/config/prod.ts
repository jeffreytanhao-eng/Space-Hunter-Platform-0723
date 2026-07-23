import type { UserConfigExport } from '@tarojs/cli'

/** 生产环境配置 */
export default {
  logger: {
    quiet: false,
    stats: false,
  },
  mini: {
    miniCssExtractPluginOption: {
      ignoreOrder: true,
    },
  },
  h5: {
    miniCssExtractPluginOption: {
      ignoreOrder: true,
    },
  },
} satisfies UserConfigExport
