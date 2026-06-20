import { useEffect, useState } from 'react'
import { moodApi, MOOD_META, type MoodHeatmap, type MoodKey } from '@/api/mood'
import { Loader2, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 心情热力图：30 天 × 5 种心情的方格图。
 * 颜色深度按当天该心情的帖子数（0=最浅，max=最深）。
 * 每个心情一行，按时间正序排列。
 */
export default function MoodHeatmap() {
  const [data, setData] = useState<MoodHeatmap | null>(null)
  const [loading, setLoading] = useState(true)
  const [hover, setHover] = useState<{ mood: MoodKey; date: string; count: number } | null>(null)

  useEffect(() => {
    moodApi
      .heatmap()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-forest-400" />
      </div>
    )
  }

  if (!data) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sage-500">数据加载失败</div>
  }

  // 找到所有 count 的最大值，用于颜色深度归一化
  const max = Math.max(
    1,
    ...Object.values(data.matrix).flatMap((row) => row)
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-forest-700">
          <Activity size={12} />
          森林心情地图
        </div>
        <h1 className="font-serif text-3xl font-bold text-forest-800">心情热力图</h1>
        <p className="mt-1 text-sm text-sage-500">
          最近 30 天的广场情绪分布 · 颜色越深代表当天该心情的帖子越多
        </p>
      </header>

      {/* 总数概览 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(Object.keys(MOOD_META) as MoodKey[]).map((m) => {
          const meta = MOOD_META[m]
          const total = data.totals[m] ?? 0
          return (
            <div
              key={m}
              className="rounded-xl border border-cream-200/70 bg-cream-50/80 p-3 text-center"
            >
              <div className="text-2xl">{meta.emoji}</div>
              <div className="mt-0.5 text-xs text-sage-500">{meta.label}</div>
              <div className="font-serif text-lg font-bold" style={{ color: meta.color }}>
                {total}
              </div>
            </div>
          )
        })}
      </div>

      {/* 热力图主体 */}
      <div className="card-sheen rounded-2xl border border-cream-200/70 bg-cream-50/80 p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-forest-800">30 天心情方阵</h2>
          <div className="flex items-center gap-2 text-[10px] text-sage-400">
            <span>少</span>
            <div className="flex gap-0.5">
              {[0.1, 0.3, 0.5, 0.75, 1].map((alpha) => (
                <span
                  key={alpha}
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: `rgba(61, 122, 77, ${alpha})` }}
                />
              ))}
            </div>
            <span>多</span>
          </div>
        </div>

        {/* 方阵：每行一种心情，30 列日期 */}
        <div className="space-y-1.5 overflow-x-auto">
          {data.moods.map((mood) => {
            const meta = MOOD_META[mood]
            const row = data.matrix[mood]
            return (
              <div key={mood} className="flex items-center gap-2">
                <div className="flex w-16 shrink-0 items-center gap-1 text-xs text-sage-600">
                  <span>{meta.emoji}</span>
                  <span className="hidden sm:inline">{meta.label}</span>
                </div>
                <div className="flex flex-1 gap-0.5">
                  {row.map((count, i) => {
                    const intensity = count === 0 ? 0 : Math.max(0.15, count / max)
                    const date = data.dates[i]
                    return (
                      <div
                        key={i}
                        onMouseEnter={() => setHover({ mood, date, count })}
                        onMouseLeave={() => setHover(null)}
                        className="h-4 flex-1 cursor-pointer rounded-sm transition-transform hover:scale-125"
                        style={{
                          backgroundColor:
                            count === 0
                              ? 'rgba(180, 165, 130, 0.1)'
                              : hexToRgba(meta.color, intensity),
                        }}
                        title={`${date} · ${meta.label}：${count} 条`}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* 日期轴 */}
        <div className="mt-2 ml-18 flex items-center gap-2 text-[10px] text-sage-400">
          <div className="w-16 shrink-0" />
          <div className="flex flex-1 justify-between">
            <span>{data.dates[0]}</span>
            <span>{data.dates[14]}</span>
            <span>{data.dates[29]}</span>
          </div>
        </div>

        {/* 悬浮提示 */}
        {hover && (
          <div className="mt-3 rounded-lg bg-cream-100/60 px-3 py-2 text-xs text-sage-600">
            {hover.date} · {MOOD_META[hover.mood].emoji} {MOOD_META[hover.mood].label}：
            <b className="ml-1 text-forest-700">{hover.count} 条</b>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-sage-400">
        发树洞帖时选择心情标签，就会出现在这里 🌱
      </p>
    </div>
  )
}

/** hex 转 rgba 字符串 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
