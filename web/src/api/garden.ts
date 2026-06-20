import client from './client'
import type { MoodKey } from './mood'

/**
 * 心情花园 V2：私人心情日记，独立于 posts。
 * 花园里的"植物"= garden_notes 表的一条日记，不再是 Post。
 */

export interface PlantVO {
  /** 实际是 noteId（V1 字段名保留，避免后端 PlantVO 大改） */
  postId: number
  mood: MoodKey
  stage: 0 | 1 | 2 | 3
  water: number
  plantedAt: string
  snippet?: string
}

export interface GardenVO {
  userId: number
  nickname: string
  mine: boolean
  plants: PlantVO[]
  stats: Partial<Record<MoodKey, number>>
  totalWater: number
}

export interface GardenNoteVO {
  id: number
  content: string
  mood?: MoodKey | null
  stage: 0 | 1 | 2 | 3
  waterCount: number
  lastWateredAt?: string | null
  transplanted: boolean
  postId?: number | null
  createdAt: string
  canWater: boolean
  canTransplant: boolean
}

export const PLANT_SPECIES: Record<MoodKey, {
  name: string
  color: string
  stages: [string, string, string, string]
}> = {
  calm: { name: '薄荷', color: '#3d7a4d', stages: ['🌰', '🌱', '🌿', '🍃'] },
  sad: { name: '蓝铃花', color: '#5a8bb5', stages: ['🌰', '🌱', '🔔', '🌷'] },
  anxious: { name: '风铃草', color: '#9b7bb8', stages: ['🌰', '🌱', '🎐', '💜'] },
  warm: { name: '向日葵', color: '#d4a373', stages: ['🌰', '🌱', '🌻', '🌼'] },
  grateful: { name: '麦穗', color: '#c9a04a', stages: ['🌰', '🌱', '🌾', '✨'] },
}

export const STAGE_NAMES = ['种子', '嫩芽', '成长', '盛开'] as const

export const gardenApi = {
  /** 花园视图（自己）：顺便触发每日自动生长 */
  mine: () => client.get<GardenVO>('/garden') as unknown as Promise<GardenVO>,
  /** 日记列表 */
  listNotes: () =>
    client.get<GardenNoteVO[]>('/garden/notes') as unknown as Promise<GardenNoteVO[]>,
  /** 单条详情 */
  noteDetail: (id: number) =>
    client.get<GardenNoteVO>(`/garden/notes/${id}`) as unknown as Promise<GardenNoteVO>,
  /** 种下新种子 */
  createNote: (data: { content: string; mood?: MoodKey }) =>
    client.post<{ id: number }>('/garden/notes', data) as unknown as Promise<{ id: number }>,
  /** 浇水（每天最多一次） */
  water: (id: number) =>
    client.patch<GardenNoteVO>(`/garden/notes/${id}/water`) as unknown as Promise<GardenNoteVO>,
  /** 移植到广场 */
  transplant: (id: number, anonymous = true) =>
    client.patch<{ postId: number }>(`/garden/notes/${id}/transplant`, null, {
      params: { anonymous },
    }) as unknown as Promise<{ postId: number }>,
  /** 删除 */
  remove: (id: number) =>
    client.delete(`/garden/notes/${id}`) as unknown as Promise<void>,
}
