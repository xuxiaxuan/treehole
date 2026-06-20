import { useEffect, useRef, useState } from 'react'
import { TarotCard } from '@/lib/tarotDeck'
import { TarotTheme } from '@/lib/tarotThemes'
import { getCardImageUrl } from '@/lib/tarotIcons'
import { cn } from '@/lib/utils'

function getRomanNumeral(num: number): string {
  if (num === 0) return 'O'
  const roman: Record<string, number> = {
    XXI: 21, XX: 20, XIX: 19, XVIII: 18, XVII: 17, XVI: 16, XV: 15, XIV: 14, XIII: 13, XII: 12, XI: 11,
    X: 10, IX: 9, VIII: 8, VII: 7, VI: 6, V: 5, IV: 4, III: 3, II: 2, I: 1
  }
  for (const key in roman) {
    if (roman[key] === num) return key
  }
  return num.toString()
}

interface TarotCardFaceProps {
  card: TarotCard
  isReversed: boolean
  positionLabel?: string
  isFlipped: boolean
  theme: TarotTheme
  onClick?: () => void
}

/**
 * 大塔罗牌组件（抽牌页用）
 * - 3D 翻转动画
 * - 翻牌瞬间光晕扩散（由 theme.glowColor 驱动）
 * - 牌背 / 牌面均由 theme 配置驱动，避免 if-else 分支（DRY）
 * - 悬停 3D 浮起
 */
export default function TarotCardFace({
  card,
  isReversed,
  positionLabel,
  isFlipped,
  theme,
  onClick,
}: TarotCardFaceProps) {
  // 翻牌瞬间触发一次光晕动画（key 重置确保再次翻转也能触发）
  const [glowKey, setGlowKey] = useState(0)
  const prevFlipped = useRef(false)
  useEffect(() => {
    if (isFlipped && !prevFlipped.current) {
      setGlowKey((k) => k + 1)
    }
    prevFlipped.current = isFlipped
  }, [isFlipped])

  const imageUrl = getCardImageUrl(card)

  return (
    <div
      className="group cursor-pointer text-center"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <div
        className="relative mb-3 aspect-[2/3] transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:[transform:rotateX(4deg)_translateY(-4px)]"
        style={{ perspective: '1000px' }}
      >
        <div
          className={cn(
            'relative h-full w-full transition-transform duration-700 ease-out',
            isFlipped && '[transform:rotateY(180deg)]'
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* 翻牌光晕环 */}
          <span
            key={glowKey}
            className={cn(
              'tarot-glow-ring',
              isFlipped && glowKey > 0 && 'is-active'
            )}
            style={
              {
                '--tarot-glow': theme.glowColor,
              } as React.CSSProperties
            }
          />

          {/* 牌背 */}
          <div
            className={cn(
              'absolute inset-0 flex flex-col overflow-hidden rounded-xl border shadow-float p-1.5',
              theme.cardBackClass
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* golden 主题叠加金箔流光 */}
            {theme.id === 'golden' && (
              <span className="tarot-shimmer-overlay pointer-events-none absolute inset-0" />
            )}
            <div className={cn(
              'relative flex h-full w-full flex-col items-center justify-center rounded-lg border border-current/20'
            )}>
              {/* 装饰角 */}
              <div className="absolute top-1.5 left-1.5 text-[8px] opacity-40">✧</div>
              <div className="absolute top-1.5 right-1.5 text-[8px] opacity-40">✧</div>
              <div className="absolute bottom-1.5 left-1.5 text-[8px] opacity-40">✧</div>
              <div className="absolute bottom-1.5 right-1.5 text-[8px] opacity-40">✧</div>

              <div className="relative flex flex-col items-center gap-2">
                <span className="text-3xl opacity-90 drop-shadow-sm">{theme.emoji}</span>
                <div className="flex flex-col items-center">
                  <span className="font-serif text-[10px] tracking-[0.3em] opacity-80">
                    TAROT
                  </span>
                  <span className="mt-1 h-px w-6 bg-current opacity-30"></span>
                </div>
              </div>
            </div>
          </div>

          {/* 牌面 */}
          <div
            className={cn(
              'absolute inset-0 flex flex-col overflow-hidden rounded-xl border shadow-float p-1.5',
              theme.cardFaceClass,
              theme.cardBorderClass,
              isReversed
                ? '[transform:rotateY(180deg)_rotate(180deg)]'
                : '[transform:rotateY(180deg)]'
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* 内部线框 */}
            <div className={cn(
              'relative flex h-full w-full flex-col items-center justify-between rounded-lg border px-2 py-3',
              theme.cardBorderClass
            )}>
              {/* 顶部序号或装饰 */}
              <div className="text-[10px] font-serif tracking-widest opacity-60">
                {card.id !== undefined && card.id < 22 ? getRomanNumeral(card.id) : '✧'}
              </div>

              {/* 中间图标/图片区 */}
              <div className="relative flex flex-1 flex-col items-center justify-center w-full py-1">
                <div className="relative w-full h-full overflow-hidden rounded-sm border border-current/10">
                  <img 
                    src={imageUrl} 
                    alt={card.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* 底部信息区 */}
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className="flex flex-col items-center">
                  <div className={cn('font-serif text-[13px] font-bold tracking-widest', theme.cardTextClass)}>
                    {card.name}
                  </div>
                  <div className="text-[8px] uppercase tracking-widest opacity-50 font-serif mt-0.5">
                    {card.nameEn}
                  </div>
                </div>

                {/* 正逆位与位置徽章 */}
                <div className="flex items-center gap-1.5">
                  {positionLabel && (
                    <span className="rounded-sm border border-current/20 px-1.5 py-[2px] text-[8px] opacity-80">
                      {positionLabel}
                    </span>
                  )}
                  <span
                    className={cn(
                      'rounded-sm px-1.5 py-[2px] text-[8px] font-medium',
                      isReversed ? theme.reversedBadgeClass : theme.uprightBadgeClass
                    )}
                  >
                    {isReversed ? '逆位' : '正位'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
