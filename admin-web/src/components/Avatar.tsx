import { Avatar as AntAvatar } from 'antd'
import type { CSSProperties, ReactNode } from 'react'

export interface AvatarProps {
  /** emoji 字符串或图片 URL；为空时回退到昵称首字母 */
  avatarUrl?: string
  nickname?: string
  size?: number
  style?: CSSProperties
}

const GRADIENT = 'linear-gradient(135deg, #3d7a4d 0%, #1f3f2a 100%)'

/** 判断是否为 emoji 字符串（非 URL 且码点数 ≤ 4） */
function isEmoji(s?: string): boolean {
  if (!s || s.startsWith('http')) return false
  return Array.from(s).length <= 4
}

/**
 * 统一头像渲染组件：
 * 1. 图片 URL → <AntAvatar src>
 * 2. emoji 字符串 → 直接渲染为 children
 * 3. 兜底 → 昵称首字母 / 'A'
 *
 * 注：偏离计划多加一个组件，避免 Layout/Profile/UserDetail 三处重复实现渲染逻辑（DRY）。
 */
export function Avatar({ avatarUrl, nickname, size = 32, style }: AvatarProps) {
  const commonStyle: CSSProperties = {
    background: GRADIENT,
    color: '#fdfaf6',
    ...style,
  }

  if (avatarUrl && avatarUrl.startsWith('http')) {
    const fallback: ReactNode = nickname?.[0]?.toUpperCase() ?? 'A'
    return (
      <AntAvatar size={size} src={avatarUrl} style={commonStyle}>
        {fallback}
      </AntAvatar>
    )
  }

  const children = isEmoji(avatarUrl)
    ? avatarUrl
    : nickname?.[0]?.toUpperCase() ?? 'A'

  return (
    <AntAvatar size={size} style={{ ...commonStyle, fontSize: Math.round(size * 0.45) }}>
      {children}
    </AntAvatar>
  )
}

export default Avatar
