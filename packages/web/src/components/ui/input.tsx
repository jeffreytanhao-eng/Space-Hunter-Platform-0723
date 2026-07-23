import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm text-star-dim">{label}</label>
      )}
      <input
        className={cn(
          'w-full rounded-lg border border-space-600 bg-space-800 px-3 py-2 text-sm text-star-white',
          'placeholder:text-star-dim/60',
          'focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30',
          'transition-colors duration-200',
          className
        )}
        {...props}
      />
    </div>
  )
}