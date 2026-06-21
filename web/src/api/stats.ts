import client from './client'

export interface PlazaStats {
  todayPosts: number
  totalPosts: number
  warmthIndex: number
  activeUsersToday: number
  warmthLabel: string
}

export const statsApi = {
  plaza: () => client.get<PlazaStats>('/stats/plaza') as unknown as Promise<PlazaStats>,
}
