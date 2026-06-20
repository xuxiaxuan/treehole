import { describe, it, expect } from 'vitest'
import { drawCards, type TarotCard } from './tarotDeck'

describe('drawCards', () => {
  const deck: TarotCard[] = [
    { id: 0, name: '愚者', nameEn: 'Fool', keywords: [], upright: '...', reversed: '...' },
    { id: 1, name: '魔术师', nameEn: 'Magician', keywords: [], upright: '...', reversed: '...' },
    { id: 2, name: '女祭司', nameEn: 'Priestess', keywords: [], upright: '...', reversed: '...' },
    { id: 3, name: '皇后', nameEn: 'Empress', keywords: [], upright: '...', reversed: '...' },
  ]

  it('draws exactly 3 distinct cards', () => {
    const drawn = drawCards(deck, 3)
    expect(drawn).toHaveLength(3)
    const ids = drawn.map((c) => c.card.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('each card has an isReversed flag', () => {
    const drawn = drawCards(deck, 3)
    drawn.forEach((d) => {
      expect(typeof d.isReversed).toBe('boolean')
    })
  })

  it('throws if deck smaller than count', () => {
    expect(() => drawCards([deck[0]], 3)).toThrow()
  })

  it('positions are 1, 2, 3', () => {
    const drawn = drawCards(deck, 3)
    expect(drawn.map((d) => d.position)).toEqual([1, 2, 3])
  })
})
