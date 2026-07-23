import { cn } from '@/lib/utils'

/* 卡片组件：实体不透明深色背景 + 发光边框效果 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: 'blue' | 'cyan' | 'purple'
}

const glowStyles = {
  blue: 'border-glow-blue',
  cyan: 'border-glow-cyan',
  purple: 'border-glow-purple',
} as const

export function Card({ glowColor = 'blue', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-space-800 p-4',
        glowStyles[glowColor],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}