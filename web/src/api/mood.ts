import client from './client'

export type MoodKey = 'calm' | 'sad' | 'anxious' | 'warm' | 'grateful'

export interface MoodHeatmap {
  moods: MoodKey[]
  dates: string[]
  matrix: Record<MoodKey, number[]>
  totals: Record<MoodKey, number>
}

export const MOOD_META: Record<MoodKey, { label: string; emoji: string; color: string }> = {
  calm: { label: '平静', emoji: '😌', color: '#3d7a4d' },
  sad: { label: '难过', emoji: '😢', color: '#5a8bb5' },
  anxious: { label: '焦虑', emoji: '😰', color: '#c95c3e' },
  warm: { label: '温暖', emoji: '🥰', color: '#d4a373' },
  grateful: { label: '感恩', emoji: '🙏', color: '#7fb069' },
}

export const moodApi = {
  heatmap: () => client.get<MoodHeatmap>('/moods/heatmap') as unknown as Promise<MoodHeatmap>,
}
