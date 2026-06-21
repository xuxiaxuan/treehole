import client from './client'
import type { MoodKey } from './mood'

// ============================================================
// 帖子附加数据（tarotData）：按 postType 区分
// ============================================================

/** 塔罗分享帖（postType=1） */
export interface TarotPostData {
  cards: Array<{
    cardId: number
    name: string
    nameEn: string
    isReversed?: boolean
    reversed?: boolean  // 兼容字段（不同写入方命名不同）
    keywords?: string[]
  }>
}

/** Wordle 帖（postType=2） */
export interface WordlePostData {
  emoji: string[]  // 每行一个 emoji 棋盘
}

/** 涂鸦帖（postType=3） */
export interface DrawingPostData {
  image: string  // base64 数据 URL
}

/** 联合类型 + 类型守卫，杜绝 as any */
export type PostData = TarotPostData | WordlePostData | DrawingPostData

export function isTarotData(d: unknown): d is TarotPostData {
  return !!d && typeof d === 'object' && Array.isArray((d as TarotPostData).cards)
}
export function isWordleData(d: unknown): d is WordlePostData {
  return !!d && typeof d === 'object' && Array.isArray((d as WordlePostData).emoji)
}
export function isDrawingData(d: unknown): d is DrawingPostData {
  return !!d && typeof d === 'object' && typeof (d as DrawingPostData).image === 'string'
}

export interface PostVO {
  id: number
  content: string
  postType: number
  /** 帖子附加数据；按 postType 用 isXxxData 守卫取具体类型 */
  tarotData?: PostData
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

/** 帖子筛选参数（首页 Tab 用） */
export interface PostListParams {
  page?: number
  size?: number
  type?: number
  sort?: 'new' | 'hot'
  mood?: MoodKey
  anonymous?: boolean
}

export const postApi = {
  list: (params: PostListParams = {}) =>
    client.get<PostList>('/posts', {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 20,
        type: params.type,
        sort: params.sort ?? 'new',
        mood: params.mood,
        anonymous: params.anonymous,
      },
    }) as unknown as Promise<PostList>,
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
