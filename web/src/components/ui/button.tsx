import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// 按钮变体：温暖治愈森林系
// 主按钮使用森林墨绿 + 柔和阴影，hover 时微浮起，替代原硬黑配色
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        // 主按钮：森林墨绿，温柔有安全感
        default:
          'bg-forest-600 text-cream-50 shadow-soft hover:bg-forest-700 hover:shadow-float',
        // 危险：陶土橘（替代刺眼纯红）
        destructive:
          'bg-clay-500 text-cream-50 shadow-soft hover:bg-clay-600 hover:shadow-float',
        // 次要：奶白底 + 暖边框
        outline:
          'border border-cream-300 bg-cream-50/60 text-sage-700 hover:bg-cream-100 hover:border-forest-300',
        // 次要填充：浅薄荷
        secondary:
          'bg-forest-50 text-forest-700 hover:bg-forest-100',
        // 幽灵按钮：透明 hover
        ghost: 'text-sage-600 hover:bg-forest-50 hover:text-forest-700',
        // 链接：森林色（替代廉价蓝）
        link: 'text-forest-600 underline-offset-4 hover:text-forest-700 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 rounded-lg px-3.5',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
