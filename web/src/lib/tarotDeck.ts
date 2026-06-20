export interface TarotCard {
  id: number
  name: string
  nameEn: string
  keywords?: string[]
  upright: string
  reversed: string
  suit?: string
}

export interface DrawnCard {
  card: TarotCard
  isReversed: boolean
  position: number // 1=过去 2=现在 3=未来（三牌阵）
}

/**
 * 从 deck 中随机抽 count 张不重复的牌，每张随机正逆位。
 * 使用 Fisher-Yates 洗牌保证均匀分布。
 */
export function drawCards(deck: TarotCard[], count: number): DrawnCard[] {
  if (deck.length < count) {
    throw new Error('Deck size smaller than draw count')
  }
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count).map((card, i) => ({
    card,
    isReversed: Math.random() < 0.5,
    position: i + 1,
  }))
}

export const POSITION_LABELS: Record<number, string> = {
  1: '过去',
  2: '现在',
  3: '未来',
}
