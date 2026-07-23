import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* 深空科技感配色系统 */
      colors: {
        /* 深空背景色阶：从最深到较浅 */
        space: {
          900: '#0a0a1a',
          800: '#0d1025',
          700: '#131636',
          600: '#1a1d4a',
        },
        /* 星云紫：装饰性渐变色 */
        nebula: {
          500: '#7c3aed',
          400: '#8b5cf6',
          300: '#a78bfa',
        },
        /* 霓虹高光色：交互强调色 */
        neon: {
          blue: '#00d4ff',
          cyan: '#00ffd4',
          purple: '#b347d9',
        },
        /* 星光色：文本与辅助色 */
        star: {
          white: '#e8e8ff',
          dim: '#8888aa',
        },
      },
      /* 科技感无衬线字体 */
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      /* 自定义动画 */
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      /* 自定义关键帧 */
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 8px rgba(0, 212, 255, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
