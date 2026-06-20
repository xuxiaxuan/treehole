import client from './client'

export interface UpdateProfileRequest {
  nickname: string
  avatarUrl?: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

/**
 * 个人中心 API：复用 /api/auth/profile 系列接口。
 * 与 web 用户端对称。
 */
export const profileApi = {
  getDetail: () => client.get('/auth/profile'),
  update: (data: UpdateProfileRequest) => client.put('/auth/profile', data),
  changePassword: (data: ChangePasswordRequest) =>
    client.put('/auth/password', data),
}
