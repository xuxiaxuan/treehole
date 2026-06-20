import { Check } from 'lucide-react'
import {
  TAROT_THEME_LIST,
  TarotTheme,
} from '@/lib/tarotThemes'
import { useTarotThemeStore } from '@/store/tarotTheme'
import { cn } from '@/lib/utils'

interface TarotThemeSwitcherProps {
  /** 选中态外环色（默认森林绿，暗色页面可传金色） */
  activeRingClass?: string
  /** 预览卡的文字色 class */
  labelClass?: string
  /** 描述文字色 class */
  descClass?: string
}

/**
 * 塔罗主题切换器
 * 横排 4 个小预览卡，点击即时切换并持久化。
 */
export default function TarotThemeSwitcher({
  activeRingClass = 'ring-forest-500',
  labelClass = 'text-sage-700',
  descClass = 'text-sage-400',
}: TarotThemeSwitcherProps) {
  const current = useTarotThemeStore((s) => s.theme)
  const setTheme = useTarotThemeStore((s) => s.setTheme)

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {TAROT_THEME_LIST.map((t) => (
        <ThemePreviewCard
          key={t.id}
          theme={t}
          isActive={current === t.id}
          onSelect={() => setTheme(t.id)}
          activeRingClass={activeRingClass}
          labelClass={labelClass}
          descClass={descClass}
        />
      ))}
    </div>
  )
}

interface ThemePreviewCardProps {
  theme: TarotTheme
  isActive: boolean
  onSelect: () => void
  activeRingClass: string
  labelClass: string
  descClass: string
}

function ThemePreviewCard({
  theme,
  isActive,
  onSelect,
  activeRingClass,
  labelClass,
  descClass,
}: ThemePreviewCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      title={theme.description}
      className={cn(
        'group relative flex w-[88px] flex-col items-center gap-1 rounded-xl border p-2 transition-all duration-200',
        'hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2',
        isActive
          ? cn('ring-2 ring-offset-2 ring-offset-cream-50', activeRingClass)
          : 'border-cream-200/70 bg-cream-50/60'
      )}
    >
      {/* 预览色块：用主题牌背 class 缩影 */}
      <span
        className={cn(
          'flex h-12 w-full items-center justify-center rounded-lg border text-xl',
          theme.cardBackClass,
          theme.cardBorderClass
        )}
      >
        <span aria-hidden="true">{theme.emoji}</span>
      </span>
      <span className={cn('text-[11px] font-medium leading-tight', labelClass)}>
        {theme.name}
      </span>
      <span className={cn('text-[9px] leading-tight', descClass)}>
        {theme.description}
      </span>
      {isActive && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-forest-500 text-white shadow-soft">
          <Check size={11} strokeWidth={3} />
        </span>
      )}
    </button>
  )
}
