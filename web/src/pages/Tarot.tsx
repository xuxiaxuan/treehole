import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tarotApi, TarotCard as ApiCard } from '@/api/tarot'
import { DrawnCard, POSITION_LABELS } from '@/lib/tarotDeck'
import { postApi } from '@/api/post'
import { useAuthStore } from '@/store/auth'
import { useTarotThemeStore } from '@/store/tarotTheme'
import { TAROT_THEMES } from '@/lib/tarotThemes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Sparkles, RefreshCw, Share2, Loader2, Moon, BookOpen, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import TarotThemeSwitcher from '@/components/TarotThemeSwitcher'
import TarotCardFace from '@/components/TarotCardFace'
import StarfieldBackground from '@/components/StarfieldBackground'

type Card = ApiCard

export default function Tarot() {
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const themeId = useTarotThemeStore((s) => s.theme)
  const theme = TAROT_THEMES[themeId]
  const [deck, setDeck] = useState<Card[]>([])
  const [drawn, setDrawn] = useState<DrawnCard[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [comment, setComment] = useState('')
  const [sharing, setSharing] = useState(false)
  const [loading, setLoading] = useState(true)

  // AI 抽牌相关
  const [question, setQuestion] = useState('')
  const [birthDate, setBirthDate] = useState(user?.birthday ?? '')
  const [drawing, setDrawing] = useState(false)
  const [aiGenerated, setAiGenerated] = useState<boolean | null>(null)
  const [drawError, setDrawError] = useState<string | null>(null)

  // AI 解读相关
  const [reading, setReading] = useState<string | null>(null)
  const [readingFallback, setReadingFallback] = useState(false)
  const [interpreting, setInterpreting] = useState(false)
  const [readingError, setReadingError] = useState<string | null>(null)

  useEffect(() => {
    tarotApi
      .deck()
      .then((d) => setDeck([...d.major, ...d.minor] as Card[]))
      .finally(() => setLoading(false))
  }, [])

  /** AI 抽牌：调后端拿到 3 个 cardId，从本地 deck 查找对应牌 */
  const startDraw = async () => {
    if (deck.length === 0 || drawing) return
    setDrawing(true)
    setDrawError(null)
    try {
      // 未登录或用户没填生日时，允许用本页输入的 birthDate
      const payloadBirth = user?.birthday ?? (birthDate || undefined)
      const res = await tarotApi.draw({
        question: question.trim() || undefined,
        birthDate: payloadBirth,
      })
      const drawnCards: DrawnCard[] = res.cards.map((c, i) => {
        const card = deck.find((d) => d.id === c.cardId)
        if (!card) throw new Error('AI 抽到了未知卡牌：id=' + c.cardId)
        return { card, isReversed: c.reversed, position: i + 1 }
      })
      setDrawn(drawnCards)
      setFlipped([])
      setAiGenerated(res.aiGenerated)
      setReading(null)
      setReadingFallback(false)
    } catch (err: any) {
      setDrawError(err?.message || '抽牌失败，请稍后重试')
    } finally {
      setDrawing(false)
    }
  }

  /** AI 解读：把已抽到的牌传给后端生成解读 */
  const interpret = async () => {
    if (interpreting || drawn.length === 0) return
    setInterpreting(true)
    setReadingError(null)
    try {
      const res = await tarotApi.reading({
        question: question.trim() || undefined,
        cards: drawn.map((d) => ({ cardId: d.card.id, reversed: d.isReversed })),
      })
      setReading(res.reading)
      setReadingFallback(res.fallback)
    } catch (err: any) {
      setReadingError(err?.message || '解读失败，请稍后重试')
    } finally {
      setInterpreting(false)
    }
  }

  const flip = (i: number) => {
    if (!flipped.includes(i)) setFlipped([...flipped, i])
  }

  const share = async () => {
    if (!user) {
      nav('/login')
      return
    }
    setSharing(true)
    try {
      const tarotData = JSON.stringify({
        spread: 'three-card',
        cards: drawn.map((d) => ({
          name: d.card.name,
          nameEn: d.card.nameEn,
          isReversed: d.isReversed,
          position: POSITION_LABELS[d.position],
          meaning: d.isReversed ? d.card.reversed : d.card.upright,
        })),
        aiGenerated,
        reading: reading || undefined,
      })
      const content =
        comment ||
        `今天的塔罗：${drawn.map((d) => (d.isReversed ? '逆位 ' : '') + d.card.name).join(' · ')}`
      const res = await postApi.create({ content, isAnonymous, postType: 1, tarotData })
      nav(`/post/${res.id}`)
    } finally {
      setSharing(false)
    }
  }

  const allFlipped = drawn.length > 0 && flipped.length === drawn.length
  const isDark = theme.enableStarfield
  // 已登录且用户已填生日 → 隐藏生日输入框；未登录或未填 → 显示
  const showBirthInput = !user?.birthday
  // 生日 max = 今天（@PastOrPresent 允许今天，禁未来）
  const yesterdayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className={cn('relative mx-auto max-w-3xl px-4 py-8 sm:px-6', theme.pageBg, theme.pageText)}>
      {isDark && (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <StarfieldBackground variant={theme.starfieldVariant} />
        </div>
      )}

      <div className="relative">
        {/* 标题区 */}
        <section className="mb-6 text-center">
          <div
            className={cn(
              'mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
              theme.badgeClass
            )}
          >
            <Moon size={12} />
            神秘指引
          </div>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">{theme.name} · 塔罗占卜</h1>
          <p className={cn('mt-2 text-sm opacity-80')}>
            AI 根据你的星座、今日运势与问题，为你抽选三张牌
          </p>
        </section>

        {/* 主题切换器 */}
        <section className="mb-8">
          <TarotThemeSwitcher
            activeRingClass={isDark ? 'ring-[#f4d03f]' : 'ring-forest-500'}
            labelClass={isDark ? 'text-[#f4d03f]' : 'text-sage-700'}
            descClass={isDark ? 'text-[#f4d03f]/70' : 'text-sage-400'}
          />
        </section>

        {drawn.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <div className="relative">
              <div className={cn('absolute inset-0 animate-pulse-soft rounded-full blur-2xl', theme.placeholderGlowClass)} />
              <div
                className={cn(
                  'relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed shadow-soft',
                  theme.placeholderRingClass
                )}
              >
                <Sparkles className={cn('h-9 w-9', isDark ? 'text-[#f4d03f]' : 'text-clay-400')} />
              </div>
            </div>

            {/* 问题 + 生日（可选） */}
            <div className="w-full max-w-md space-y-3">
              <Textarea
                placeholder="默念你的问题（可选，不填则做整体运势）"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                className="bg-cream-50/90 text-sage-700 placeholder:text-sage-400"
              />
              {showBirthInput && (
                <div className="flex items-center gap-2 rounded-xl bg-cream-50/90 px-4 py-2.5">
                  <Label htmlFor="tarot-birth" className="shrink-0 text-sm text-sage-700">
                    生日
                  </Label>
                  <Input
                    id="tarot-birth"
                    type="date"
                    max={yesterdayStr}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="border-0 bg-transparent text-sage-700"
                  />
                  <span className="text-xs text-sage-400">用于星座推算</span>
                </div>
              )}
            </div>

            <Button
              size="lg"
              onClick={startDraw}
              disabled={loading || drawing}
              className={cn('gap-2', theme.buttonClass)}
            >
              {loading || drawing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {drawing ? 'AI 选牌中…' : '准备牌组…'}
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  AI 为我抽牌
                </>
              )}
            </Button>

            {drawError && (
              <p className="text-sm text-red-600">{drawError}</p>
            )}
          </div>
        ) : (
          <>
            {/* AI 抽牌来源提示 */}
            {aiGenerated !== null && (
              <div className="mb-4 text-center text-xs opacity-70">
                {aiGenerated ? (
                  <span className="inline-flex items-center gap-1">
                    <Sparkles size={11} /> AI 已根据你的星座与今日运势抽牌
                  </span>
                ) : (
                  <span>AI 暂不可用，已为你随机抽牌</span>
                )}
              </div>
            )}

            {/* 牌阵 */}
            <div className="mb-8 grid grid-cols-3 gap-4 sm:gap-6">
              {drawn.map((d, i) => {
                const isFlipped = flipped.includes(i)
                return (
                  <div key={i} className="text-center">
                    <TarotCardFace
                      card={d.card}
                      isReversed={d.isReversed}
                      positionLabel={POSITION_LABELS[d.position]}
                      isFlipped={isFlipped}
                      theme={theme}
                      onClick={() => flip(i)}
                    />
                    {isFlipped ? (
                      <p className={cn('px-1 text-xs leading-relaxed opacity-80')}>
                        {d.isReversed ? d.card.reversed : d.card.upright}
                      </p>
                    ) : (
                      <p className={cn('text-xs opacity-60')}>点击翻牌</p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* AI 解读区 */}
            {allFlipped && (
              <Card className="animate-fade-in mb-6 bg-cream-50/90 text-sage-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-forest-800">
                    <BookOpen size={18} className="text-clay-400" />
                    AI 牌意解读
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reading ? (
                    <div
                      className={cn(
                        'whitespace-pre-wrap rounded-xl p-4 text-sm leading-relaxed',
                        readingFallback
                          ? 'bg-cream-100/70 text-sage-600'
                          : 'bg-gradient-to-br from-cream-100/80 to-sage-50/60 text-sage-800'
                      )}
                    >
                      {reading}
                      {readingFallback && (
                        <div className="mt-2 text-xs text-sage-400">
                          （AI 服务暂不可用，以上是兜底文案）
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={interpret}
                      disabled={interpreting}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      {interpreting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          AI 解读中…
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          生成 AI 解读
                        </>
                      )}
                    </Button>
                  )}
                  {readingError && (
                    <p className="text-sm text-red-600">{readingError}</p>
                  )}
                  {reading && !readingFallback && (
                    <Button
                      onClick={interpret}
                      disabled={interpreting}
                      variant="ghost"
                      size="sm"
                      className="w-full gap-1.5"
                    >
                      <RefreshCw size={13} />
                      重新生成
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 分享卡片 */}
            {allFlipped && (
              <Card className="animate-fade-in bg-cream-50/90 text-sage-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-forest-800">
                    <Share2 size={18} className="text-clay-400" />
                    分享到广场
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="写下你的感想（可选）"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center gap-2 rounded-xl bg-cream-100/60 px-4 py-3">
                    <Switch
                      id="tarot-anon"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                    />
                    <Label htmlFor="tarot-anon">匿名分享</Label>
                  </div>
                  <Button onClick={share} disabled={sharing} className="w-full gap-2" size="lg">
                    {sharing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        分享中…
                      </>
                    ) : (
                      <>
                        <Share2 size={16} />
                        分享到广场
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setDrawn([])
                  setFlipped([])
                  setReading(null)
                  setAiGenerated(null)
                }}
                disabled={drawing || interpreting}
                className={cn('gap-1.5', isDark && 'text-[#f4d03f] hover:bg-white/10')}
              >
                <RefreshCw size={15} />
                重新抽
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
