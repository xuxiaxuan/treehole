import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { echoApi, type EchoRoom as EchoRoomVO, type EchoClusterDetail, type EchoLetterVO } from '@/api/echo'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import PostCard from '@/components/PostCard'
import { Loader2, Moon, ArrowLeft, Sparkles, Users, Mail, MailOpen, Send, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 共鸣信号页：
 * - 无 clusterId → 列表模式（昨夜所有共鸣）
 * - 有 clusterId → 单房间详情：帖子列表 + 写信区 + 信件揭信区
 */
export default function EchoRoom() {
  const { date, clusterId } = useParams<{ date?: string; clusterId?: string }>()
  const [room, setRoom] = useState<EchoRoomVO | null>(null)
  const [detail, setDetail] = useState<EchoClusterDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (clusterId) {
      echoApi
        .detail(Number(clusterId))
        .then(setDetail)
        .catch(() => setDetail(null))
        .finally(() => setLoading(false))
    } else {
      const promise = date ? echoApi.byDate(date) : echoApi.today()
      promise
        .then(setRoom)
        .catch(() => setRoom(null))
        .finally(() => setLoading(false))
    }
  }, [clusterId, date])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#9b7bb8]" />
      </div>
    )
  }

  if (clusterId) return <ClusterDetail detail={detail} />
  return <ClusterList room={room} />
}

function ClusterList({ room }: { room: EchoRoomVO | null }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-500 transition-colors hover:text-forest-700"
      >
        <ArrowLeft size={15} />
        回到广场
      </Link>

      <header className="mb-6 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#9b7bb8]/10 px-3 py-1 text-xs font-medium text-[#7c5fa3]">
          <Moon size={12} />
          昨夜的回响
        </div>
        <h1 className="font-serif text-3xl font-bold text-forest-800">共鸣信号</h1>
        <p className="mt-1 text-sm text-sage-500">
          系统在凌晨悄悄找出 · 昨晚想着相似事的彼此
        </p>
      </header>

      {!room || room.clusters.length === 0 ? <EmptyEcho /> : (
        <div className="space-y-3">
          {room.clusters.map((c) => (
            <Link
              key={c.id}
              to={`/echo/${c.id}`}
              className={cn(
                'block rounded-2xl border bg-cream-50/80 p-4 shadow-soft transition-all',
                'hover:-translate-y-0.5 hover:shadow-float',
                c.mine ? 'border-[#9b7bb8] bg-[#9b7bb8]/5' : 'border-cream-200/70'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#9b7bb8]" />
                    <span className="font-serif text-base font-bold text-forest-800">
                      「{c.summary}」
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-sage-500">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {c.memberCount} 人共鸣
                    </span>
                    {c.mine && (
                      <span className="rounded-full bg-[#9b7bb8]/15 px-2 py-0.5 text-[10px] font-medium text-[#7c5fa3]">
                        你也在这里
                      </span>
                    )}
                    <span className="text-sage-400">· 进房间可写匿名信</span>
                  </div>
                </div>
                <Moon size={20} className="text-[#9b7bb8]/40" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-sage-400">
        系统每天凌晨 03:00 自动聚类相似心声 · 完全匿名无身份暴露
      </p>
    </div>
  )
}

function ClusterDetail({ detail }: { detail: EchoClusterDetail | null }) {
  if (!detail) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sage-500">
        共鸣房间不存在或已过期
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/echo"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-500 transition-colors hover:text-forest-700"
      >
        <ArrowLeft size={15} />
        所有共鸣
      </Link>

      <header className="mb-6 rounded-2xl border border-[#9b7bb8]/30 bg-[#9b7bb8]/5 p-5 text-center">
        <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-[#7c5fa3]">
          <Moon size={12} />
          共鸣房间 · {detail.date}
        </div>
        <h1 className="font-serif text-2xl font-bold text-forest-800">
          「{detail.summary}」
        </h1>
        <p className="mt-1.5 text-sm text-sage-500">
          {detail.memberCount} 人在昨夜 · 想着相似的事
        </p>
      </header>

      {/* 帖子区 */}
      <div className="space-y-4">
        {detail.posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      {/* 信件区 */}
      <LetterSection
        clusterId={detail.id}
        canWrite={detail.mine && !detail.archived}
        archived={!!detail.archived}
        revealed={!!detail.revealed}
      />

      <p className="mt-6 text-center text-xs text-sage-400">
        这里没有身份 · 只有共鸣 ✨
      </p>
    </div>
  )
}

/**
 * 信件区域：写信 + 揭信。
 * - canWrite=false（非房间成员）：只展示信件揭信情况，不能写
 * - 已写信：表单替换为"已寄出"状态
 * - 未揭信：他人信件显示"封缄中"占位
 * - 已揭信：展示所有信件内容
 */
function LetterSection({
  clusterId,
  canWrite,
  archived,
  revealed,
}: {
  clusterId: number
  canWrite: boolean
  archived: boolean
  revealed: boolean
}) {
  const user = useAuthStore((s) => s.user)
  const [letters, setLetters] = useState<EchoLetterVO[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    echoApi
      .letters(clusterId)
      .then(setLetters)
      .catch(() => setLetters([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [clusterId])

  const submit = async () => {
    if (!content.trim() || sending) return
    setSending(true)
    setError('')
    try {
      await echoApi.writeLetter(clusterId, content.trim())
      setContent('')
      load()
    } catch (e: any) {
      setError(e?.message || '寄信失败')
    } finally {
      setSending(false)
    }
  }

  const mineLetter = letters.find((l) => l.mine)
  const otherLetters = letters.filter((l) => !l.mine)

  return (
    <div className="mt-8 rounded-2xl border border-[#9b7bb8]/30 bg-[#9b7bb8]/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-serif text-base font-bold text-forest-800">
          <Mail size={15} className="text-[#7c5fa3]" />
          匿名信件
          {archived && (
            <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-medium text-sage-600">
              已归档
            </span>
          )}
        </h2>
        <span className="text-[10px] text-sage-500">
          {revealed ? '📮 信件已揭封' : `✉ 今晚 22:00 揭信`}
        </span>
      </div>

      {archived && (
        <p className="mb-3 rounded-lg bg-sage-50 px-3 py-2 text-[11px] text-sage-600">
          📦 房间已归档 · 只读模式 · 信件仍可查看但不能再写
        </p>
      )}

      {/* 写信区 */}
      {canWrite && !mineLetter && user && (
        <div className="mb-4 rounded-xl border border-[#9b7bb8]/20 bg-white/60 p-3">
          <Textarea
            placeholder="给同房间的人写一句话…（匿名 · ≤100 字 · 22:00 一起揭信）"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={200}
            className="bg-white/80 text-sm"
          />
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-sage-500">
              {content.length} / 100 · 每人每房间限 1 封
            </span>
            <Button onClick={submit} disabled={sending || !content.trim()} size="sm" className="gap-1">
              {sending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
              寄出
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-clay-500">{error}</p>}
        </div>
      )}

      {mineLetter && (
        <div className="mb-4 rounded-xl border border-[#9b7bb8]/30 bg-white/70 p-3">
          <div className="mb-1 text-[10px] text-[#7c5fa3]">📮 你寄出的信</div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-sage-700">
            {mineLetter.content}
          </p>
        </div>
      )}

      {/* 信件列表 */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-sage-400" />
        </div>
      ) : letters.length === 0 ? (
        <p className="py-6 text-center text-xs text-sage-500">
          {canWrite ? '还没有人写信 · 做第一个寄信人吧' : '房间里还没有信'}
        </p>
      ) : (
        <div className="space-y-2">
          {otherLetters.map((l) => (
            <LetterCard key={l.id} letter={l} />
          ))}
        </div>
      )}

      {/* 未登录提示 */}
      {!user && canWrite && (
        <p className="mt-3 text-center text-[11px] text-sage-500">
          <Link to="/login" className="text-[#7c5fa3] underline">登录</Link> 后可以给房间写信
        </p>
      )}

      <p className="mt-3 flex items-center justify-center gap-1 text-[10px] text-sage-400">
        <Lock size={9} />
        完全匿名 · 永不暴露身份 · 房间 24h 后归档
      </p>
    </div>
  )
}

function LetterCard({ letter }: { letter: EchoLetterVO }) {
  if (!letter.content) {
    // 未揭信占位
    return (
      <div className="rounded-xl border border-dashed border-[#9b7bb8]/30 bg-white/30 px-3 py-3 text-center">
        <span className="inline-flex items-center gap-1 text-[11px] text-[#9b7bb8]">
          <Mail size={11} />
          一封封缄中的信 · 等待今晚 22:00 揭封
        </span>
      </div>
    )
  }
  return (
    <div className="rounded-xl bg-white/70 p-3 shadow-soft">
      <div className="mb-1 flex items-center gap-1 text-[10px] text-sage-500">
        <MailOpen size={10} className="text-[#7c5fa3]" />
        来自一位同房间的人
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-sage-700">
        {letter.content}
      </p>
    </div>
  )
}

function EmptyEcho() {
  return (
    <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50/50 px-4 py-12 text-center">
      <div className="mb-3 text-5xl opacity-50">🌙</div>
      <p className="font-serif text-base font-medium text-forest-800">昨夜还没有人共鸣</p>
      <p className="mt-1 text-sm text-sage-500">也许今天晚上 · 就会有相似的灵魂相遇</p>
      <Link
        to="/new"
        className="mt-4 inline-block rounded-full bg-forest-gradient px-4 py-1.5 text-sm font-medium text-cream-50 shadow-soft transition-transform hover:scale-105"
      >
        留下心声
      </Link>
    </div>
  )
}
