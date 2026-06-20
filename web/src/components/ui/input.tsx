import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

// 输入框：暖色边框 + forest focus 态 + 大圆角
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-cream-300 bg-cream-50/60 px-4 py-2 text-sm text-sage-700 placeholder:text-sage-400 transition-all duration-200',
          'focus-visible:outline-none focus-visible:border-forest-400 focus-visible:ring-4 focus-visible:ring-forest-100',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
