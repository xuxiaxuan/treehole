import client from './client'

export interface StorySegmentVO {
  id: number
  content: string
  isAnonymous: boolean
  createdAt: string
  authorId?: number
  authorNickname?: string
  authorAvatarUrl?: string
}

export interface StoryVO {
  id: number
  title: string
  opening: string
  isAnonymous: boolean
  segmentCount: number
  status: number
  createdAt: string
  updatedAt: string
  authorId?: number
  authorNickname?: string
  authorAvatarUrl?: string
  segments?: StorySegmentVO[]
}

export interface StoryList {
  list: StoryVO[]
  total: number
}

export const storyApi = {
  list: (page = 1, size = 20) =>
    client.get<StoryList>('/stories', { params: { page, size } }) as unknown as Promise<StoryList>,
  detail: (id: number) => client.get<StoryVO>(`/stories/${id}`) as unknown as Promise<StoryVO>,
  create: (data: { title: string; opening: string; isAnonymous?: boolean }) =>
    client.post<{ id: number }>('/stories', data) as unknown as Promise<{ id: number }>,
  appendSegment: (storyId: number, data: { content: string; isAnonymous?: boolean }) =>
    client.post<{ id: number }>(`/stories/${storyId}/segments`, data) as unknown as Promise<{ id: number }>,
  finish: (storyId: number) =>
    client.post<void>(`/stories/${storyId}/finish`) as unknown as Promise<void>,
}
