import client from './client'
import type { MoodKey } from './mood'

export interface PostVO {
  id: number
  content: string
  postType: number
  tarotData?: any
  likeCount: number
  liked: boolean
  isAnonymous: boolean
  authorId?: number
  authorNickname: string
  authorAvatarUrl?: string
  createdAt: string
  /** 心情标签：calm/sad/anxious/warm/grateful（可空） */
  mood?: MoodKey | null
}

export interface PostList {
  list: PostVO[]
  total: number
}

export interface WarmReplyVO {
  reply: string
  fallback: boolean
}

export interface CreatePostPayload {
  content: string
  isAnonymous: boolean
  postType?: number
  tarotData?: string
  /** 心情标签，可空 */
  mood?: MoodKey
}

export const postApi = {
  list: (page = 1, size = 20, type?: number) =>
    client.get<PostList>('/posts', { params: { page, size, type } }) as unknown as Promise<PostList>,
  search: (q: string, page = 1, size = 20, type?: number) =>
    client.get<PostList>('/posts/search', { params: { q, page, size, type } }) as unknown as Promise<PostList>,
  detail: (id: number) => client.get<PostVO>(`/posts/${id}`) as unknown as Promise<PostVO>,
  create: (data: CreatePostPayload) =>
    client.post<{ id: number }>('/posts', data) as unknown as Promise<{ id: number }>,
  like: (id: number) =>
    client.post<{ liked: boolean; likeCount: number }>(`/posts/${id}/like`) as unknown as Promise<{
      liked: boolean
      likeCount: number
    }>,
  /** AI 暖心回复：fallback=true 表示 LLM 不可用走了兜底文案 */
  warmReply: (id: number) =>
    client.post<WarmReplyVO>(`/posts/${id}/warm-reply`) as unknown as Promise<WarmReplyVO>,
}
