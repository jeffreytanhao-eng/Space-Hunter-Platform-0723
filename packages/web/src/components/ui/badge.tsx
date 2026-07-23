import { cn } from '@/lib/utils'

/* 徽章变体 */
const variants = {
  default: 'bg-space-600 text-star-dim',
  blue: 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30',
  cyan: 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30',
  purple: 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30',
} as const

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}