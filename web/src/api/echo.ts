import client from './client'
import type { PostVO } from './post'

export interface EchoClusterSummary {
  id: number
  date: string
  summary: string
  memberCount: number
  /** 当前登录用户是否在该 cluster */
  mine: boolean
}

export interface EchoRoom {
  date: string
  totalCount: number
  clusters: EchoClusterSummary[]
}

export interface EchoClusterDetail extends EchoClusterSummary {
  posts: PostVO[]
  archived?: boolean
  revealed?: boolean
}

/** 共鸣信件：未揭信时他人 content 为 null */
export interface EchoLetterVO {
  id: number
  content: string | null
  mine: boolean
  createdAt: string
  revealedAt?: string | null
  revealed: boolean
}

export const echoApi = {
  today: () => client.get<EchoRoom>('/echo/today') as unknown as Promise<EchoRoom>,
  byDate: (date: string) =>
    client.get<EchoRoom>('/echo', { params: { date } }) as unknown as Promise<EchoRoom>,
  detail: (clusterId: number) =>
    client.get<EchoClusterDetail>(`/echo/${clusterId}`) as unknown as Promise<EchoClusterDetail>,
  /** 信件列表（未登录可调用，揭信后可见他人 content） */
  letters: (clusterId: number) =>
    client.get<EchoLetterVO[]>(`/echo/${clusterId}/letters`) as unknown as Promise<EchoLetterVO[]>,
  /** 写信（每用户每房间 1 封） */
  writeLetter: (clusterId: number, content: string) =>
    client.post<{ id: number }>(`/echo/${clusterId}/letters`, { content }) as unknown as Promise<{ id: number }>,
}

