import client from './client'

export interface DanmakuVO {
  id: number
  content: string
  color: string
  isAnonymous: boolean
  createdAt: string
  lane: number
  authorNickname?: string
}

export const danmakuApi = {
  list: (postId: number, limit = 50) =>
    client.get<DanmakuVO[]>(`/posts/${postId}/danmaku`, { params: { limit } }) as unknown as Promise<DanmakuVO[]>,

  send: (postId: number, data: { content: string; color?: string; isAnonymous?: boolean }) =>
    client.post<{ id: number }>(`/posts/${postId}/danmaku`, data) as unknown as Promise<{ id: number }>,
}
