import client from './client'

export interface TarotCard {
  id: number
  name: string
  nameEn: string
  suit?: string
  keywords: string[]
  upright: string
  reversed: string
}

export interface TarotDeck {
  major: TarotCard[]
  minor: TarotCard[]
}

/** AI 抽牌请求：birthDate / question 可选 */
export interface TarotDrawRequest {
  birthDate?: string  // ISO yyyy-MM-dd
  question?: string
}

/** AI 抽牌响应：aiGenerated=false 表示兜底随机抽 */
export interface TarotDrawVO {
  cards: { cardId: number; reversed: boolean }[]
  aiGenerated: boolean
}

/** AI 解读请求 */
export interface TarotReadingRequest {
  question?: string
  cards: { cardId: number; reversed: boolean }[]
}

/** AI 解读响应：fallback=true 表示 LLM 不可用走了兜底文案 */
export interface TarotReadingVO {
  reading: string
  fallback: boolean
}

export const tarotApi = {
  deck: () => client.get<TarotDeck>('/tarot/deck') as unknown as Promise<TarotDeck>,

  /** AI 抽牌：根据生日+星座+日期+问题选 3 张牌；失败自动回退随机 */
  draw: (data: TarotDrawRequest) =>
    client.post<TarotDrawVO>('/tarot/draw', data) as unknown as Promise<TarotDrawVO>,

  /** AI 解读：基于已抽到的牌生成中文解读；失败返回 fallback 文案 */
  reading: (data: TarotReadingRequest) =>
    client.post<TarotReadingVO>('/tarot/reading', data) as unknown as Promise<TarotReadingVO>,
}
