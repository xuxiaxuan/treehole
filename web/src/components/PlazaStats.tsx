import { useEffect, useState } from 'react'
import { statsApi, type PlazaStats } from '@/api/stats'
import { Sprout, Heart, Users, Sparkles } from 'lucide-react'

/**
 * 广场统计概览条：今日新声 / 累计 / 温暖指数 / 今日活跃。
 * 静态展示，无加载骨架（数据失败时静默隐藏，避免抢焦点）。
 */
export default function PlazaStatsBar() {
  const [stats, setStats] = useState<PlazaStats | null>(null)

  useEffect(() => {
    statsApi
      .plaza()
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  if (!stats) return null

  // 温暖指数颜色映射
  const warmthColor =
    stats.warmthIndex >= 85
      ? '#c95c3e'
      : stats.warmthIndex >= 70
        ? '#3d7a4d'
        : stats.warmthIndex >= 55
          ? '#7fb069'
          : stats.warmthIndex >= 40
            ? '#5a8bb5'
            : '#9b7bb8'

  return (
    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <StatCard
        icon={<Sprout size={13} />}
        label="今日新声"
        value={stats.todayPosts}
        color="#3d7a4d"
      />
      <StatCard
        icon={<Sparkles size={13} />}
        label="累计心声"
        value={stats.totalPosts}
        color="#c9a04a"
      />
      <StatCard
        icon={<Heart size={13} />}
        label={`今日${stats.warmthLabel}`}
        value={stats.warmthIndex}
        suffix="/100"
        color={warmthColor}
      />
      <StatCard
        icon={<Users size={13} />}
        label="今日活跃"
        value={stats.activeUsersToday}
        color="#9b7bb8"
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-cream-200/70 bg-cream-50/80 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1 text-[10px] text-sage-500">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <span
          className="font-serif text-xl font-bold tabular-nums"
          style={{ color }}
        >
          {value.toLocaleString()}
        </span>
        {suffix && <span className="text-[10px] text-sage-400">{suffix}</span>}
      </div>
    </div>
  )
}
