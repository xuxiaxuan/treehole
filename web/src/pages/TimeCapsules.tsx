import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  capsuleApi,
  CAPSULE_PRESETS,
  formatRemaining,
  type CapsuleVO,
  type CreateCapsulePayload,
} from '@/api/capsule'
import { MOOD_META, type MoodKey } from '@/api/mood'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  AlertCircle,
  Loader2,
  Hourglass,
  Mail,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 时间胶囊页：左侧封印表单 + 右侧胶囊列表。
 * 已揭封的胶囊显示 "查看广场" 跳到对应帖子。
 */
export default function TimeCapsules() {
  const user = useAuthStore((s) => s.user)
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [mood, setMood] = useState<MoodKey | ''>('')
  const [presetDays, setPresetDays] = useState<number>(7)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [capsules, setCapsules] = useState<CapsuleVO[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const list = await capsuleApi.list()
      setCapsules(list)
    } catch {
      setCapsules([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    load()
  }, [user?.id])

  const revealAt = useMemo(() => {
    const d = new Date(Date.now() + presetDays * 86400_000)
    return d.toISOString()
  }, [presetDays])

  const submit = async () => {
    if (!content.trim()) {
      setError('内容不能为空')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const payload: CreateCapsulePayload = {
        content,
        isAnonymous,
        mood: mood || undefined,
        revealAt,
      }
      await capsuleApi.create(payload)
      setContent('')
      await load()
    } catch (err: any) {
      setError(err?.message || '封印失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sage-500">
        登录后才能种下时间胶囊
      </div>
    )
  }

  const moodKeys = Object.keys(MOOD_META) as MoodKey[]
  const sealed = capsules.filter((c) => !c.revealed && !c.failed)
  const opened = capsules.filter((c) => c.revealed)
  const failed = capsules.filter((c) => c.failed)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#9b7bb8]/10 px-3 py-1 text-xs font-medium text-[#7c5fa3]">
          <Hourglass size={12} />
          写给未来
        </div>
        <h1 className="font-serif text-3xl font-bold text-forest-800">时间胶囊</h1>
        <p className="mt-1 text-sm text-sage-500">
          把此刻封印起来 · 到指定时间会自动显形在广场
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 左：创建表单 */}
        <div className="card-sheen animate-fade-in rounded-2xl border border-cream-200/70 bg-cream-50/80 p-5 shadow-soft">
          <h2 className="mb-3 flex items-center gap-1.5 font-serif text-base font-bold text-forest-800">
            <Mail size={14} />
            封一封信
          </h2>
          <Textarea
            placeholder="此刻想跟未来说什么？"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            maxLength={2000}
            className="bg-white/80"
          />
          <div className="mt-1 flex justify-end text-[10px] text-sage-400">
            {content.length} / 2000
          </div>

          {/* 封印时长 */}
          <div className="mt-3">
            <div className="mb-1.5 text-xs text-sage-500">封印时长</div>
            <div className="flex flex-wrap gap-1.5">
              {CAPSULE_PRESETS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setPresetDays(p.days)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs transition-all',
                    presetDays === p.days
                      ? 'bg-[#9b7bb8] text-white shadow-soft'
                      : 'bg-white/70 text-sage-500 hover:bg-white'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-sage-400">
              预计揭封：{new Date(revealAt).toLocaleString('zh-CN')}
            </p>
          </div>

          {/* 匿名 */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-cream-100/60 px-3 py-2">
            <Label htmlFor="cap-anon" className="cursor-pointer text-xs text-sage-600">
              {isAnonymous ? '🎭 匿名显形' : '🙂 实名显形'}
            </Label>
            <Switch id="cap-anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          {/* 心情 */}
          <div className="mt-3">
            <div className="mb-1.5 text-xs text-sage-500">心情（可选）</div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setMood('')}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs',
                  mood === '' ? 'bg-sage-200 text-sage-700' : 'bg-white/70 text-sage-500'
                )}
              >
                不选
              </button>
              {moodKeys.map((m) => {
                const meta = MOOD_META[m]
                const active = mood === m
                return (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs',
                      active ? 'text-white' : 'bg-white/70 text-sage-500'
                    )}
                    style={active ? { backgroundColor: meta.color } : undefined}
                  >
                    {meta.emoji} {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-clay-200 bg-clay-50 px-3 py-2 text-xs text-clay-600">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={submit}
            disabled={submitting || !content.trim()}
            className="mt-4 w-full gap-1.5"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            封印胶囊
          </Button>
        </div>

        {/* 右：胶囊列表 */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 font-serif text-base font-bold text-forest-800">
            <Hourglass size={14} />
            我的胶囊（{capsules.length}）
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-sage-400" />
            </div>
          ) : capsules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50/50 px-4 py-10 text-center text-sm text-sage-500">
              还没有任何胶囊
              <br />
              写下第一封给未来的信吧
            </div>
          ) : (
            <>
              {sealed.length > 0 && (
                <div className="text-[11px] font-medium uppercase tracking-wider text-[#9b7bb8]">
                  🔒 封印中（{sealed.length}）
                </div>
              )}
              {sealed.map((c) => (
                <CapsuleCard key={c.id} capsule={c} />
              ))}

              {opened.length > 0 && (
                <div className="mt-4 text-[11px] font-medium uppercase tracking-wider text-forest-600">
                  🌱 已显形（{opened.length}）
                </div>
              )}
              {opened.map((c) => (
                <CapsuleCard key={c.id} capsule={c} />
              ))}

              {failed.length > 0 && (
                <div className="mt-4 text-[11px] font-medium uppercase tracking-wider text-clay-500">
                  ⚠️ 揭封失败（{failed.length}） · 内容违规，无法显形
                </div>
              )}
              {failed.map((c) => (
                <CapsuleCard key={c.id} capsule={c} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CapsuleCard({ capsule }: { capsule: CapsuleVO }) {
  const meta = capsule.mood ? MOOD_META[capsule.mood] : null
  return (
    <div
      className={cn(
        'rounded-2xl border bg-cream-50/80 p-4 transition-all',
        capsule.failed
          ? 'border-clay-200 opacity-70'
          : capsule.revealed
            ? 'border-forest-200'
            : 'border-[#9b7bb8]/30 animate-capsule-pulse'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] text-sage-500">
          {capsule.failed ? (
            <>
              <AlertCircle size={10} className="text-clay-500" />
              内容违规 · 未显形
            </>
          ) : capsule.revealed ? (
            <>
              <Sparkles size={10} className="text-forest-500" />
              {new Date(capsule.revealAt).toLocaleDateString('zh-CN')} 已显形
            </>
          ) : (
            <>
              <Hourglass size={10} className="text-[#9b7bb8]" />
              剩 {formatRemaining(capsule.remainingSeconds)}
            </>
          )}
        </span>
        {meta && (
          <span className="text-xs" style={{ color: meta.color }}>
            {meta.emoji} {meta.label}
          </span>
        )}
      </div>

      <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-sage-700">
        {capsule.content}
      </p>

      {capsule.revealed && capsule.postId && (
        <Link
          to={`/post/${capsule.postId}`}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-forest-600 hover:text-forest-800"
        >
          <ExternalLink size={11} />
          查看广场上的帖子
        </Link>
      )}
    </div>
  )
}
