import { cn } from '@/lib/utils'

/* 按钮变体 */
const variants = {
  primary: 'bg-neon-blue text-space-900 hover:bg-neon-blue/90 glow-blue',
  secondary: 'bg-space-600 text-star-white hover:bg-space-700 border border-space-600',
  ghost: 'text-star-dim hover:text-star-white hover:bg-space-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
} as const

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
} as const

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}