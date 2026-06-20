import client from './client'

export interface NotificationVO {
  id: number
  type: 'like_post' | 'comment' | 'reply' | 'follow'
  actorId: number
  actorNickname?: string
  actorAvatarUrl?: string
  postId?: number
  commentId?: number
  snippet?: string
  read: boolean
  createdAt: string
}

export interface NotificationList {
  list: NotificationVO[]
  unreadCount: number
  total: number
}

export const notificationApi = {
  list: (page = 1, size = 20) =>
    client.get<NotificationList>('/notifications', { params: { page, size } }) as unknown as Promise<NotificationList>,

  unreadCount: () =>
    client.get<{ unreadCount: number }>('/notifications/unread-count') as unknown as Promise<{ unreadCount: number }>,

  readAll: () =>
    client.post<{ updated: number }>('/notifications/read-all') as unknown as Promise<{ updated: number }>,
}
