import client from './client'
import type { MoodKey } from './mood'

export interface CapsuleVO {
  id: number
  content: string
  mood?: MoodKey | null
  isAnonymous: boolean
  revealAt: string
  revealed: boolean
  /** 揭封失败（违规等永久错误），不会重试 */
  failed?: boolean
  postId?: number | null
  createdAt: string
  /** 距揭封剩余秒数（已揭封返回 0） */
  remainingSeconds: number
}

export interface CreateCapsulePayload {
  content: string
  isAnonymous: boolean
  mood?: MoodKey
  revealAt: string  // ISO 字符串
}

/** 预设封印时长选项 */
export const CAPSULE_PRESETS = [
  { label: '1 天', days: 1 },
  { label: '7 天', days: 7 },
  { label: '30 天', days: 30 },
  { label: '100 天', days: 100 },
  { label: '1 年', days: 365 },
] as const

export const capsuleApi = {
  create: (data: CreateCapsulePayload) =>
    client.post<{ id: number }>('/capsules', data) as unknown as Promise<{ id: number }>,
  list: (page = 1, size = 50) =>
    client.get<CapsuleVO[]>('/capsules', { params: { page, size } }) as unknown as Promise<CapsuleVO[]>,
}

/** 把剩余秒数格式化为"X天 X时 X分" */
export function formatRemaining(seconds: number): string {
  if (seconds <= 0) return '已揭封'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d} 天 ${h} 时`
  if (h > 0) return `${h} 时 ${m} 分`
  return `${m} 分钟`
}
