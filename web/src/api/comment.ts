import client from './client'

export interface CommentVO {
  id: number
  content: string
  isAnonymous: boolean
  likeCount: number
  liked: boolean
  createdAt: string
  authorId?: number
  authorNickname?: string
  authorAvatarUrl?: string
  parentId?: number | null
  replyToUserId?: number | null
  replyToNickname?: string
  deleted?: boolean
  children?: CommentVO[]
  canDelete?: boolean
}

export interface CommentList {
  list: CommentVO[]
  total: number
}

export interface CreateCommentData {
  content: string
  parentId?: number | null
  replyToUserId?: number | null
  isAnonymous?: boolean
}

export const commentApi = {
  list: (postId: number, page = 1, size = 20) =>
    client.get<CommentList>(`/posts/${postId}/comments`, { params: { page, size } }) as unknown as Promise<CommentList>,

  create: (postId: number, data: CreateCommentData) =>
    client.post<{ id: number }>(`/posts/${postId}/comments`, data) as unknown as Promise<{ id: number }>,

  delete: (id: number) =>
    client.delete<void>(`/comments/${id}`) as unknown as Promise<void>,

  like: (id: number) =>
    client.post<{ liked: boolean; likeCount: number }>(`/comments/${id}/like`) as unknown as Promise<{
      liked: boolean
      likeCount: number
    }>,
}
