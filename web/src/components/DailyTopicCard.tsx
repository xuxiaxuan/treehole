import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { topicApi, type TopicVO } from '@/api/topic'
import { Sparkles, Loader2, ArrowRight } from 'lucide-react'

/**
 * 每日话题卡片：点击「参与话题」跳到发帖页，并在 URL 里带 topic 参数。
 * 发帖页接到后自动把 #今日话题 加到内容里。
 */
export default function DailyTopicCard() {
  const [topic, setTopic] = useState<TopicVO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    topicApi
      .today()
      .then(setTopic)
      .catch(() => setTopic(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="mb-6 flex items-center gap-3 rounded-2xl border border-cream-200/70 bg-cream-50/60 p-4">
        <Loader2 size={16} className="animate-spin text-sage-400" />
        <span className="text-sm text-sage-400">正在揭晓今日话题…</span>
      </section>
    )
  }

  if (!topic) return null

  return (
    <section className="card-sheen relative mb-6 overflow-hidden rounded-2xl border border-clay-200/60 bg-gradient-to-br from-clay-50/80 via-cream-50/70 to-forest-50/50 p-5 shadow-soft backdrop-blur-sm">
      {/* 装饰光斑 */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-clay-200/30 blur-3xl" />

      <div className="relative">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-gradient text-cream-50 shadow-soft">
            <Sparkles size={13} />
          </span>
          <span className="text-xs font-medium text-clay-600">今日话题 · {topic.date}</span>
        </div>

        <h3 className="font-serif text-lg font-bold text-forest-800 sm:text-xl">{topic.title}</h3>
        <p className="mt-1 text-sm text-sage-500">{topic.prompt}</p>

        <Link
          to={`/new?topicDate=${encodeURIComponent(topic.date)}&topicTitle=${encodeURIComponent(topic.title)}`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-forest-gradient px-4 py-1.5 text-xs font-medium text-cream-50 shadow-soft transition-transform hover:scale-105 active:scale-95"
        >
          参与话题
          <ArrowRight size={12} />
        </Link>
      </div>
    </section>
  )
}
