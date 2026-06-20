import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { echoApi, type EchoRoom as EchoRoomVO } from '@/api/echo'
import { Moon, Users, ArrowRight } from 'lucide-react'

/**
 * 共鸣信号 Banner：首页顶部展示昨夜共鸣。
 * - 仅在有 cluster 时展示
 * - 当前用户若在某 cluster 内，加高亮 "你也在这里"
 */
export default function EchoBanner() {
  const [room, setRoom] = useState<EchoRoomVO | null>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    echoApi
      .today()
      .then((r) => {
        if (r && r.clusters.length > 0) setRoom(r)
      })
      .catch(() => {})
  }, [])

  // 取有 mine=true 的 cluster 优先，否则取 memberCount 最大
  const highlight = room?.clusters.find((c) => c.mine) ?? room?.clusters?.[0]
  if (!visible || !room || !highlight) return null

  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl border border-[#9b7bb8]/30 bg-gradient-to-br from-[#9b7bb8]/10 via-[#7c5fa3]/8 to-cream-50/80 p-4 shadow-soft">
      {/* 装饰月亮 */}
      <div className="pointer-events-none absolute -right-4 -top-4 text-6xl opacity-15">🌙</div>

      <button
        onClick={() => setVisible(false)}
        className="absolute right-2 top-2 z-10 rounded-full bg-white/50 px-1.5 py-0.5 text-[10px] text-sage-500 hover:bg-white/80"
        aria-label="关闭"
      >
        ✕
      </button>

      <Link to={`/echo/${highlight.id}`} className="relative block">
        <div className="flex items-start gap-3">
          <span className="animate-echo-pulse flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70">
            <Moon size={18} className="text-[#7c5fa3]" />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#7c5fa3]">
              <Moon size={11} />
              共鸣信号 · 昨夜的回响
              <ArrowRight size={11} className="opacity-60" />
            </div>
            <p className="mt-1 font-serif text-base font-bold text-forest-800">
              「{highlight.summary}」
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-sage-600">
              <span className="flex items-center gap-0.5">
                <Users size={11} />
                {highlight.memberCount} 人想着相似的事
              </span>
              {highlight.mine && (
                <span className="rounded-full bg-[#9b7bb8]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#7c5fa3]">
                  你也在这里 ✨
                </span>
              )}
              {room.totalCount > 1 && (
                <span className="text-sage-400">· 查看全部 {room.totalCount} 个共鸣</span>
              )}
            </p>
          </div>
        </div>
      </Link>
    </div>
  )
}
