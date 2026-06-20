import client from './client'
import type { User } from '@/store/auth'

export interface AuthResponse {
  token: string
  user: User
}

export interface RegisterData {
  email: string
  password: string
  nickname: string
  /** 生日（可选），ISO yyyy-MM-dd；用于 AI 塔罗抽牌 */
  birthday?: string
}

export interface UpdateProfileData {
  nickname: string
  avatarUrl?: string
  /** 生日（可选），传 null 表示不修改；用于 AI 塔罗抽牌 */
  birthday?: string | null
}

export const authApi = {
  register: (data: RegisterData) =>
    client.post<AuthResponse>('/auth/register', data) as unknown as Promise<AuthResponse>,
  login: (data: { email: string; password: string }) =>
    client.post<AuthResponse>('/auth/login', data) as unknown as Promise<AuthResponse>,
  me: () => client.get<User>('/auth/me') as unknown as Promise<User>,
  updateProfile: (data: UpdateProfileData) =>
    client.put<User>('/auth/profile', data) as unknown as Promise<User>,
}
