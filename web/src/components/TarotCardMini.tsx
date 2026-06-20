import { TarotTheme } from '@/lib/tarotThemes'
import { cn } from '@/lib/utils'

interface TarotCardMiniProps {
  name: string
  /** 牌面图片 URL */
  icon: string
  isReversed: boolean
  theme: TarotTheme
  size?: 'sm' | 'md'
  /** 英文名（可选，size='md' 时显示） */
  nameEn?: string
}

/**
 * 小塔罗牌组件（PostDetail / 分享卡用）
 * - 紧凑布局：缩略图 + 牌名 + 正逆位小徽章
 * - 用 theme 配置驱动视觉，与大牌面保持主题一致
 */
export default function TarotCardMini({
  name,
  icon,
  isReversed,
  theme,
  size = 'md',
  nameEn,
}: TarotCardMiniProps) {
  const isSm = size === 'sm'
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border shadow-soft transition-transform hover:-translate-y-0.5',
        theme.cardFaceClass,
        theme.cardBorderClass,
        isSm ? 'px-2 py-1' : 'px-2.5 py-1.5'
      )}
    >
      <div className={cn(
        'relative overflow-hidden rounded-sm border border-current/10 shrink-0',
        isSm ? 'w-5 h-8' : 'w-7 h-11'
      )} aria-hidden="true">
        <img 
          src={icon} 
          alt={name} 
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            isReversed && "[transform:rotate(180deg)]"
          )}
          loading="lazy"
        />
      </div>
      <div className="flex flex-col">
        <span
          className={cn(
            'font-medium leading-tight',
            theme.cardTextClass,
            isSm ? 'text-xs' : 'text-sm'
          )}
        >
          {name}
        </span>
        {!isSm && nameEn && (
          <span className="text-[10px] opacity-60">{nameEn}</span>
        )}
      </div>
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[9px] font-medium',
          isReversed ? theme.reversedBadgeClass : theme.uprightBadgeClass
        )}
      >
        {isReversed ? '逆' : '正'}
      </span>
    </div>
  )
}
