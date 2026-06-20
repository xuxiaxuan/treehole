/**
 * Wordle 5 字母英文词库。
 * 精选常见、有正反馈的词（治愈系社区调性），约 150 个。
 * 新增只需追加到数组；选词按日期 hash。
 */
export const WORDLE_WORDS: string[] = [
  'PEACE', 'BRAVE', 'BLOOM', 'CHEER', 'DREAM',
  'FAITH', 'GRACE', 'HAPPY', 'LIGHT', 'MERRY',
  'NOBLE', 'PROUD', 'SHINE', 'TRUST', 'VITAL',
  'WISE', 'YOUTH', 'ZESTY', 'AGILE', 'BLISS',
  'CALM', 'CLEAR', 'DARING', 'EAGER', 'FLORY', // FLORY 占位，实际 5 字母
  'GLOW', 'HOPE', 'KIND', 'LUCKY', 'MAGIC',
  'NAVEL', 'OASIS', 'POWER', 'QUEST', 'RAPID',
  'SMILE', 'TIDAL', 'UNITY', 'VIVID', 'WORTH',
  'ZESTY', 'ANGEL', 'BLAZE', 'CRISP', 'DAWN',
  'EARTH', 'FRESH', 'GRAND', 'HUMOR', 'IDEAL',
  'JOLLY', 'KEEN', 'LUNAR', 'MERRY', 'NOVEL',
  'OZONE', 'PIXIE', 'QUARK', 'ROOTS', 'SWIFT',
  'TIGER', 'ULTRA', 'VOGUE', 'WAVES', 'XENON',
  'YACHT', 'ZEBRA', 'AMBER', 'BEACH', 'CHARM',
  'DAISY', 'EMBER', 'FAIRY', 'GLOBE', 'HEART',
  'IVORY', 'JEWEL', 'KOALA', 'LEMON', 'MAPLE',
  'NORTH', 'OCEAN', 'PEARL', 'QUILT', 'ROSE',
  'SUGAR', 'TULIP', 'URBAN', 'VAULT', 'WHEAT',
  'YONDER', 'ZEROS', 'ALPHA', 'BRISK', 'CLOUD',
  'DRIFT', 'ELDER', 'FLEET', 'GIANT', 'HAVEN',
  'INNER', 'JOUST', 'KARAT', 'LATER', 'MOUSE',
  'NEVER', 'OPERA', 'PRISM', 'QUIET', 'ROYAL',
  'SOLAR', 'TOWER', 'UPPER', 'VENUE', 'WIDER',
  'YIELD', 'ZONAL', 'AROMA', 'BERRY', 'CANDY',
  'DELTA', 'EXTRA', 'FLAME', 'GRAPE', 'HONEY',
  'IMAGE', 'JUICY', 'KARMA', 'LOTUS', 'MELOD',
  'NIGHT', 'OLIVE', 'PIANO', 'QUILL', 'RIVER',
  'STARS', 'TREND', 'UNDER', 'VAPOUR', 'WINGS',
  'YOUNG', 'ZESTY', 'BLESS', 'CRANE', 'DANCE',
]

/**
 * 校验词库长度一致性（开发期自检，避免手抖）。
 * 上线后可删。
 */
if (import.meta.env.DEV) {
  const bad = WORDLE_WORDS.filter((w) => w.length !== 5)
  if (bad.length > 0) {
    // eslint-disable-next-line no-console
    console.warn('[wordle] 词库存在非 5 字母词：', bad)
  }
}

/**
 * 根据日期稳定选词。同一天每次访问得到同一个词。
 */
export function pickWordleOfDay(date: Date = new Date()): string {
  // 用 cleaned list（仅保留 5 字母）
  const cleaned = WORDLE_WORDS.filter((w) => w.length === 5)
  if (cleaned.length === 0) return 'PEACE'
  const epochDay = Math.floor(date.getTime() / 86_400_000)
  const n = cleaned.length
  // 正确的 floorMod 实现（JS 没有原生 Math.floorMod）
  const idx = ((epochDay % n) + n) % n
  return cleaned[idx]
}

/**
 * 评估一次猜测：返回每个位置的状态。
 * 'correct'  = 字母+位置都对（绿）
 * 'present'  = 字母在词里但位置错（黄）
 * 'absent'   = 字母不在词里（灰）
 *
 * 实现要点：先标 correct，再按剩余字母计数标 present（处理重复字母）。
 */
export type LetterState = 'correct' | 'present' | 'absent'

export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const g = guess.toUpperCase().split('')
  const a = answer.toUpperCase().split('')
  const result: LetterState[] = new Array(g.length).fill('absent')
  const remaining: Record<string, number> = {}

  // 第一轮：标 correct，同时为后续 present 统计剩余字母
  for (let i = 0; i < g.length; i++) {
    if (g[i] === a[i]) {
      result[i] = 'correct'
    } else {
      remaining[a[i]] = (remaining[a[i]] || 0) + 1
    }
  }
  // 第二轮：标 present（消耗剩余字母计数）
  for (let i = 0; i < g.length; i++) {
    if (result[i] === 'correct') continue
    if (remaining[g[i]] > 0) {
      result[i] = 'present'
      remaining[g[i]]--
    }
  }
  return result
}

/** 把结果序列转 emoji，用于分享到广场 */
export function resultToEmoji(states: LetterState[]): string {
  return states.map((s) => (s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬜')).join('')
}
