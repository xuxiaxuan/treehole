/**
 * 塔罗牌 emoji 映射
 * - 22 张大阿尔卡那按 id 索引
 * - 小阿尔卡那按花色统一映射（后端数据不全，按花色归一）
 * - 兜底：🃏
 */

/** 大阿尔卡那：0愚者 ~ 21世界 */
export const MAJOR_ICONS: Record<number, string> = {
  0: '🌅', // 愚者
  1: '🪄', // 魔术师
  2: '🌙', // 女祭司
  3: '👑', // 皇后
  4: '🏛️', // 皇帝
  5: '🔐', // 教皇
  6: '💞', // 恋人
  7: '⚔️', // 战车
  8: '🦁', // 力量
  9: '🏮', // 隐士
  10: '🎡', // 命运之轮
  11: '⚖️', // 正义
  12: '🙃', // 倒吊人
  13: '💀', // 死神
  14: '🌊', // 节制
  15: '👹', // 魔鬼
  16: '🗼', // 高塔
  17: '⭐', // 星星
  18: '🌝', // 月亮
  19: '☀️', // 太阳
  20: '📯', // 审判
  21: '🌐', // 世界
}

/** 小阿尔卡那：四花色对应元素 */
export const SUIT_ICONS: Record<string, string> = {
  wands: '🔥', // 权杖-火
  cups: '💧', // 圣杯-水
  swords: '🌬️', // 宝剑-风
  pentacles: '🪙', // 星币-土
}

/** 兜底 emoji */
const FALLBACK_ICON = '🃏'

/** 大阿尔卡那中文名 → emoji（PostDetail 中 tarotData 仅存 name 字符串时反查用） */
export const MAJOR_NAME_ICONS: Record<string, string> = {
  愚者: '🌅',
  魔术师: '🪄',
  女祭司: '🌙',
  皇后: '👑',
  皇帝: '🏛️',
  教皇: '🔐',
  恋人: '💞',
  战车: '⚔️',
  力量: '🦁',
  隐士: '🏮',
  命运之轮: '🎡',
  正义: '⚖️',
  倒吊人: '🙃',
  死神: '💀',
  节制: '🌊',
  魔鬼: '👹',
  高塔: '🗼',
  星星: '⭐',
  月亮: '🌝',
  太阳: '☀️',
  审判: '📯',
  世界: '🌐',
}

/** 小阿尔卡那英文名前缀 → 花色 key（nameEn 通常是 "Ace of Wands" 等） */
const SUIT_KEYS = ['wands', 'cups', 'swords', 'pentacles'] as const

/**
 * 根据 card 字段返回合适 emoji。
 * 大阿尔卡那优先按 id 匹配；否则按 suit 匹配花色；最后兜底。
 */
export function getCardIcon(card: { id: number; suit?: string }): string {
  if (card.id >= 0 && card.id <= 21 && MAJOR_ICONS[card.id]) {
    return MAJOR_ICONS[card.id]
  }
  if (card.suit && SUIT_ICONS[card.suit]) {
    return SUIT_ICONS[card.suit]
  }
  return FALLBACK_ICON
}

/**
 * 根据 card 获取塔罗牌的真实图片路径
 * - 从 public/tarot-images/ 加载
 * - 大阿尔卡纳：m00.jpg ~ m21.jpg
 * - 小阿尔卡纳：通过解析 nameEn 获取（如 w01.jpg, c14.jpg）
 */
export function getCardImageUrl(card: { id: number; suit?: string; nameEn?: string }): string {
  // 大阿尔卡纳
  if (card.id >= 0 && card.id <= 21) {
    const idStr = String(card.id).padStart(2, '0')
    return `/tarot-images/m${idStr}.jpg`
  }

  // 小阿尔卡纳，通过 nameEn 解析
  if (card.nameEn) {
    const lower = card.nameEn.toLowerCase()
    let suitPrefix = ''
    if (lower.includes('cups')) suitPrefix = 'c'
    else if (lower.includes('swords')) suitPrefix = 's'
    else if (lower.includes('wands')) suitPrefix = 'w'
    else if (lower.includes('pentacles')) suitPrefix = 'p'

    if (suitPrefix) {
      let num = 1
      if (lower.includes('ace')) num = 1
      else if (lower.includes('two')) num = 2
      else if (lower.includes('three')) num = 3
      else if (lower.includes('four')) num = 4
      else if (lower.includes('five')) num = 5
      else if (lower.includes('six')) num = 6
      else if (lower.includes('seven')) num = 7
      else if (lower.includes('eight')) num = 8
      else if (lower.includes('nine')) num = 9
      else if (lower.includes('ten')) num = 10
      else if (lower.includes('page')) num = 11
      else if (lower.includes('knight')) num = 12
      else if (lower.includes('queen')) num = 13
      else if (lower.includes('king')) num = 14
      
      const numStr = String(num).padStart(2, '0')
      return `/tarot-images/${suitPrefix}${numStr}.jpg`
    }
  }

  // 兜底返回一张默认牌背或随机牌（这里返回愚者）
  return '/tarot-images/m00.jpg'
}

/**
 * 根据牌的中文/英文名字反查图片 URL。
 * 用于 PostDetail 场景：tarotData 只保存了 name/nameEn 字符串。
 */
export function getCardIconByName(name?: string, nameEn?: string): string {
  // 先尝试从中文名反推 id
  let matchedId = -1
  if (name) {
    const MAJOR_NAMES = [
      '愚者', '魔术师', '女祭司', '皇后', '皇帝', '教皇', '恋人', '战车', '力量', '隐士', 
      '命运之轮', '正义', '倒吊人', '死神', '节制', '魔鬼', '高塔', '星星', '月亮', '太阳', 
      '审判', '世界'
    ]
    matchedId = MAJOR_NAMES.indexOf(name)
  }

  return getCardImageUrl({ id: matchedId, nameEn: nameEn || name })
}

