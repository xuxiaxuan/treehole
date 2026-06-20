import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

// 文本域：与 Input 一致的治愈系视觉
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[96px] w-full rounded-xl border border-cream-300 bg-cream-50/60 px-4 py-3 text-sm text-sage-700 placeholder:text-sage-400 transition-all duration-200',
          'focus-visible:outline-none focus-visible:border-forest-400 focus-visible:ring-4 focus-visible:ring-forest-100',
          'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
