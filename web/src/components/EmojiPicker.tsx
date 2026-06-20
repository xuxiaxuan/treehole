import * as Popover from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/**
 * 森林系 24 枚 emoji 头像库。
 */
const EMOJIS = [
  '🦊', '🦉', '🐿️', '🦔', '🐰', '🐻',
  '🦌', '🐢', '🌳', '🌲', '🌿', '🍃',
  '🍄', '🌱', '🌸', '🍁', '🌙', '⭐',
  '🌞', '🌧️', '❄️', '🔥', '💧', '🌈',
]

export interface EmojiPickerProps {
  /** 当前选中值：emoji 字符串或 undefined（表示使用昵称首字母） */
  value?: string
  onChange: (value: string | undefined) => void
  /** 自定义触发器 */
  children: ReactNode
}

/**
 * emoji 头像选择器：基于 Radix Popover，6 列网格。
 * 含「使用昵称首字母」清空选项。
 */
export function EmojiPicker({ value, onChange, children }: EmojiPickerProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          className="z-50 w-72 animate-fade-in rounded-2xl border border-cream-200 bg-cream-50 p-3 shadow-float"
        >
          <div className="mb-2 text-xs text-sage-500">选一只森林小伙伴</div>
          <div className="grid grid-cols-6 gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onChange(e)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all hover:bg-forest-100',
                  value === e && 'bg-forest-100 ring-2 ring-forest-400'
                )}
              >
                {e}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="mt-2 w-full rounded-lg px-3 py-1.5 text-xs text-sage-500 transition-colors hover:bg-cream-100"
          >
            使用昵称首字母
          </button>
          <Popover.Arrow className="fill-cream-50" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default EmojiPicker
