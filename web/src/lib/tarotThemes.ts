/**
 * 塔罗主题配置
 * 每套主题为一个配置对象，由 TarotCardFace / TarotCardMini 等组件统一消费。
 * 所有视觉差异通过 class 字符串集合表达，避免 if-else 分支（DRY）。
 * 作用域仅限塔罗相关 UI，不动整站森林暖色系。
 */

export type TarotThemeId = 'classic' | 'mystical' | 'golden' | 'minimal'

export interface TarotTheme {
  /** 主题唯一标识 */
  id: TarotThemeId
  /** 展示名称（含 emoji） */
  name: string
  /** 副标题/描述 */
  description: string
  /** 主题代表性 emoji（用于切换器预览、牌背装饰） */
  emoji: string
  /** 页面背景 class（仅塔罗页外层包裹） */
  pageBg: string
  /** 页面主文字色 class */
  pageText: string
  /** 牌背根 class */
  cardBackClass: string
  /** 牌面根 class */
  cardFaceClass: string
  /** 牌边框 class */
  cardBorderClass: string
  /** 牌面文字色 class */
  cardTextClass: string
  /** 正位徽章 class */
  uprightBadgeClass: string
  /** 逆位徽章 class */
  reversedBadgeClass: string
  /** 翻牌光晕颜色（CSS color，用于 keyframes 背景色） */
  glowColor: string
  /** 是否启用粒子背景（仅暗色主题开启，性能优先） */
  enableStarfield: boolean
  /** 粒子背景变体（仅当 enableStarfield=true 时生效） */
  starfieldVariant?: 'mystical' | 'golden'
  /** 引导徽章背景 class（抽牌前的"神秘指引"标签） */
  badgeClass: string
  /** 主按钮附加 class */
  buttonClass: string
  /** 装饰圆环背景色（抽牌前占位圆） */
  placeholderRingClass: string
  /** 装饰圆环模糊光晕 class */
  placeholderGlowClass: string
}

export const TAROT_THEMES: Record<TarotThemeId, TarotTheme> = {
  classic: {
    id: 'classic',
    name: '🌿 森林治愈',
    description: '默认森林暖色，温柔治愈',
    emoji: '🌳',
    pageBg: 'bg-cream-50',
    pageText: 'text-forest-800',
    cardBackClass:
      'bg-forest-gradient text-cream-100 border-forest-700',
    cardFaceClass: 'bg-cream-50 text-forest-800',
    cardBorderClass: 'border-forest-200',
    cardTextClass: 'text-forest-800',
    uprightBadgeClass: 'bg-forest-100 text-forest-700',
    reversedBadgeClass: 'bg-clay-100 text-clay-600',
    glowColor: 'rgba(61, 122, 77, 0.55)',
    enableStarfield: false,
    badgeClass: 'bg-clay-50 text-clay-600',
    buttonClass: '',
    placeholderRingClass: 'border-forest-300 bg-cream-50',
    placeholderGlowClass: 'bg-clay-200/40',
  },
  mystical: {
    id: 'mystical',
    name: '🌙 暗夜星象',
    description: '深紫黑底，金白星点流动',
    emoji: '✨',
    pageBg: 'bg-[#0f0a2e]',
    pageText: 'text-[#f4d03f]',
    cardBackClass:
      'bg-[linear-gradient(135deg,#1a1240_0%,#0f0a2e_100%)] text-[#f4d03f] border-[#3d2b7a]',
    cardFaceClass: 'bg-[#1a1240] text-[#f4d03f]',
    cardBorderClass: 'border-[#3d2b7a]',
    cardTextClass: 'text-[#f4d03f]',
    uprightBadgeClass: 'bg-[#3d2b7a] text-[#f4d03f]',
    reversedBadgeClass: 'bg-[#5b3b8c]/40 text-[#f4d03f]',
    glowColor: 'rgba(244, 208, 63, 0.75)',
    enableStarfield: true,
    starfieldVariant: 'mystical',
    badgeClass: 'bg-[#3d2b7a]/60 text-[#f4d03f]',
    buttonClass:
      'bg-[#3d2b7a] text-[#f4d03f] hover:bg-[#5b3b8c]',
    placeholderRingClass: 'border-[#3d2b7a] bg-[#1a1240]',
    placeholderGlowClass: 'bg-[#f4d03f]/30',
  },
  golden: {
    id: 'golden',
    name: '👑 金色仪式',
    description: '深酒红底，金箔光斑漂浮',
    emoji: '👑',
    pageBg: 'bg-[#3d1f1f]',
    pageText: 'text-[#e8c878]',
    cardBackClass:
      'bg-[linear-gradient(135deg,#5a2828_0%,#3d1f1f_100%)] text-[#e8c878] border-[#a8842f]',
    cardFaceClass: 'bg-[#3d1f1f] text-[#e8c878]',
    cardBorderClass: 'border-[#a8842f]',
    cardTextClass: 'text-[#e8c878]',
    uprightBadgeClass: 'bg-[#a8842f]/30 text-[#e8c878]',
    reversedBadgeClass: 'bg-[#7a1f1f]/60 text-[#e8c878]',
    glowColor: 'rgba(232, 200, 120, 0.8)',
    enableStarfield: true,
    starfieldVariant: 'golden',
    badgeClass: 'bg-[#a8842f]/25 text-[#e8c878]',
    buttonClass:
      'bg-[#a8842f] text-[#3d1f1f] hover:bg-[#c89a3f]',
    placeholderRingClass: 'border-[#a8842f] bg-[#5a2828]',
    placeholderGlowClass: 'bg-[#e8c878]/30',
  },
  minimal: {
    id: 'minimal',
    name: '⚫ 极简黑白',
    description: '纯灰背景，黑色细线几何',
    emoji: '◻️',
    pageBg: 'bg-[#f5f5f5]',
    pageText: 'text-black',
    cardBackClass: 'bg-black text-white border-black',
    cardFaceClass: 'bg-white text-black border-black',
    cardBorderClass: 'border-black',
    cardTextClass: 'text-black',
    uprightBadgeClass: 'bg-black text-white',
    reversedBadgeClass: 'bg-gray-200 text-black',
    glowColor: 'rgba(255, 255, 255, 0.85)',
    enableStarfield: false,
    badgeClass: 'bg-gray-100 text-black',
    buttonClass:
      'bg-black text-white hover:bg-gray-800',
    placeholderRingClass: 'border-black bg-white',
    placeholderGlowClass: 'bg-gray-300/50',
  },
}

/** 主题列表（用于切换器渲染） */
export const TAROT_THEME_LIST: TarotTheme[] = [
  TAROT_THEMES.classic,
  TAROT_THEMES.mystical,
  TAROT_THEMES.golden,
  TAROT_THEMES.minimal,
]

/** 默认主题 */
export const DEFAULT_TAROT_THEME: TarotThemeId = 'classic'
