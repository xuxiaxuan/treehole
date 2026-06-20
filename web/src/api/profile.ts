import client from './client'
import type { User } from '@/store/auth'

export interface UpdateProfileRequest {
  nickname: string
  avatarUrl?: string
  /** 生日（可选），传 null 表示不修改；用于 AI 塔罗抽牌 */
  birthday?: string | null
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

/**
 * 个人中心 API：复用 /api/auth/profile 系列接口。
 */
export const profileApi = {
  getDetail: () => client.get<User>('/auth/profile') as unknown as Promise<User>,
  update: (data: UpdateProfileRequest) =>
    client.put<User>('/auth/profile', data) as unknown as Promise<User>,
  changePassword: (data: ChangePasswordRequest) =>
    client.put<void>('/auth/password', data) as unknown as Promise<void>,
}
