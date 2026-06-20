import { useEffect, useState } from 'react'
import { fortuneApi, type DailyFortune } from '@/api/fortune'
import { useAuthStore } from '@/store/auth'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 每日运势卡片：登录用户在首页顶部可见。
 * LLM 不可用时 fallback=true，展示浅色兜底文案。
 */
export default function DailyFortuneCard() {
  const user = useAuthStore((s) => s.user)
  const [fortune, setFortune] = useState<DailyFortune | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fortuneApi.today()
      setFortune(data)
    } catch {
      setFortune(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) load()
    else setLoading(false)
  }, [user?.id])

  if (!user) return null

  return (
    <section
      className={cn(
        'card-sheen relative mb-6 overflow-hidden rounded-2xl border p-5 shadow-soft backdrop-blur-sm',
        fortune?.fallback
          ? 'border-cream-200 bg-cream-50/70'
          : 'border-forest-200/70 bg-gradient-to-br from-forest-50/80 via-cream-50/70 to-sage-50/60'
      )}
    >
      {/* 装饰光斑 */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-forest-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-clay-200/25 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest-gradient text-cream-50 shadow-soft">
          <Sparkles size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <h2 className="font-serif text-base font-bold text-forest-800">
              {fortune?.zodiac ? `${fortune.zodiac} · 今日运势` : '今日运势'}
            </h2>
            {fortune && (
              <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs text-sage-500">
                {fortune.date}
              </span>
            )}
            {fortune?.fallback && (
              <span className="rounded-full bg-clay-50 px-2 py-0.5 text-xs text-clay-500">
                兜底文案
              </span>
            )}
            <button
              onClick={load}
              disabled={loading}
              title="刷新"
              className="ml-auto rounded-full p-1.5 text-sage-400 transition-colors hover:bg-cream-100 hover:text-forest-600 disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-3 text-sm text-sage-400">
              <Loader2 size={14} className="animate-spin" />
              AI 正在为你抽今日的能量…
            </div>
          ) : fortune ? (
            <p
              className={cn(
                'whitespace-pre-wrap text-sm leading-relaxed',
                fortune.fallback ? 'text-sage-500' : 'text-sage-700'
              )}
            >
              {fortune.fortune}
            </p>
          ) : (
            <p className="py-3 text-sm text-sage-400">
              运势加载失败，稍后再来 ✨
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
