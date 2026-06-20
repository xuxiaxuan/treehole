import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  TarotThemeId,
  DEFAULT_TAROT_THEME,
} from '@/lib/tarotThemes'

interface TarotThemeState {
  theme: TarotThemeId
  setTheme: (id: TarotThemeId) => void
}

/**
 * 塔罗主题偏好 store
 * - localStorage 持久化，匿名用户也可用
 * - key 与 treehole-auth 同款命名风格
 */
export const useTarotThemeStore = create<TarotThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_TAROT_THEME,
      setTheme: (id) => set({ theme: id }),
    }),
    { name: 'treehole-tarot-theme' }
  )
)
