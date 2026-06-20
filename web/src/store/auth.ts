import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  email: string
  nickname: string
  /** 生日（可选），ISO yyyy-MM-dd；用于 AI 塔罗抽牌的星座推算 */
  birthday?: string | null
  avatarUrl?: string
  role: number
  status?: number
  createdAt?: string
  /** 个人中心统计：发帖总数（仅 /auth/profile 接口填充） */
  postCount?: number
  /** 个人中心统计：收到点赞总数（仅 /auth/profile 接口填充） */
  likeReceivedTotal?: number
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  updateUser: (patch: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : {})),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'treehole-auth' }
  )
)
