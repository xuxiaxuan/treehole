import { cn } from '@/lib/utils'
import { User2 } from 'lucide-react'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps {
  /** emoji 字符串或图片 URL；为空时回退到昵称首字母 */
  avatarUrl?: string
  nickname?: string
  size?: AvatarSize
  className?: string
}

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-20 w-20 text-3xl',
}

const SIZE_ICON: Record<AvatarSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 32,
}

/**
 * 判断是否为 emoji 字符串：非 URL 且码点数 ≤ 4（兼容组合 emoji / ZWJ 序列）。
 */
function isEmoji(s?: string): boolean {
  if (!s || s.startsWith('http')) return false
  return Array.from(s).length <= 4
}

/**
 * 统一头像渲染组件：
 * 1. emoji（avatarUrl 为非 URL 短字符串）→ 直接渲染 emoji
 * 2. 图片 URL（http 开头）→ <img>
 * 3. 兜底 → 昵称首字母，无昵称时显示 User2 图标
 */
export function Avatar({ avatarUrl, nickname, size = 'md', className }: AvatarProps) {
  const base = cn(
    'flex shrink-0 items-center justify-center rounded-full bg-forest-gradient text-cream-50 shadow-soft overflow-hidden font-medium',
    SIZE_CLASS[size],
    className
  )

  if (isEmoji(avatarUrl)) {
    return <span className={base}>{avatarUrl}</span>
  }
  if (avatarUrl && avatarUrl.startsWith('http')) {
    return <img src={avatarUrl} alt={nickname ?? 'avatar'} className={cn(base, 'object-cover')} />
  }
  const initial = nickname?.[0]?.toUpperCase()
  return (
    <span className={base}>
      {initial ?? <User2 size={SIZE_ICON[size]} />}
    </span>
  )
}

export default Avatar
