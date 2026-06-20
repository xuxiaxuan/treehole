import client from './client'

export interface DailyFortune {
  zodiac: string | null
  date: string
  fortune: string
  fallback: boolean
}

export const fortuneApi = {
  today: () => client.get<DailyFortune>('/fortune/today') as unknown as Promise<DailyFortune>,
}
