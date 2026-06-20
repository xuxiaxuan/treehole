import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  gardenApi,
  PLANT_SPECIES,
  STAGE_NAMES,
  type GardenNoteVO,
  type GardenVO,
  type PlantVO,
} from '@/api/garden'
import { MOOD_META, type MoodKey } from '@/api/mood'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  Sprout,
  Droplets,
  ArrowLeft,
  Plus,
  Share2,
  Trash2,
  ExternalLink,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 心情花园 V2：**私人心情日记**，独立于广场。
 * 左：植物网格（按 mood 分组，可视化生长）
 * 右：日记列表（浇水 / 移植 / 删除）
 */
export default function Garden() {
  const user = useAuthStore((s) => s.user)
  const [garden, setGarden] = useState<GardenVO | null>(null)
  const [notes, setNotes] = useState<GardenNoteVO[]>([])
  const [loading, setLoading] = useState(true)

  // 发新日记
  const [newContent, setNewContent] = useState('')
  const [newMood, setNewMood] = useState<MoodKey | ''>('')
  const [submitting, setSubmitting] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [g, ns] = await Promise.all([gardenApi.mine(), gardenApi.listNotes()])
      setGarden(g)
      setNotes(ns)
    } catch {
      setGarden(null)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadAll()
  }, [user?.id])

  const plantPositions = useMemo(() => layoutPlants(garden?.plants ?? []), [garden])

  const plant = async () => {
    if (!newContent.trim() || submitting) return
    setSubmitting(true)
    try {
      await gardenApi.createNote({
        content: newContent,
        mood: newMood || undefined,
      })
      setNewContent('')
      setNewMood('')
      await loadAll()
    } finally {
      setSubmitting(false)
    }
  }

  const water = async (id: number) => {
    try {
      const updated = await gardenApi.water(id)
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
    } catch (e: any) {
      alert(e?.message || '浇水失败')
    }
  }

  const transplant = async (note: GardenNoteVO) => {
    if (!confirm('把这条日记匿名移植到广场？\n（移植后会在广场出现一条匿名帖）')) return
    try {
      const res = await gardenApi.transplant(note.id, true)
      alert('已显形到广场 🌱')
      await loadAll()
    } catch (e: any) {
      alert(e?.message || '移植失败')
    }
  }

  const remove = async (id: number) => {
    if (!confirm('确定把这株植物拔掉吗？')) return
    try {
      await gardenApi.remove(id)
      await loadAll()
    } catch (e: any) {
      alert(e?.message || '删除失败')
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sage-500">
        登录后才能拥有自己的花园
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-forest-400" />
      </div>
    )
  }

  const moodKeys = Object.keys(PLANT_SPECIES) as MoodKey[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-500 transition-colors hover:text-forest-700"
      >
        <ArrowLeft size={15} />
        回到广场
      </Link>

      <header className="mb-6 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-forest-700">
          <Lock size={11} />
          私密空间 · 只有你能看到
        </div>
        <h1 className="font-serif text-3xl font-bold text-forest-800">我的花园</h1>
        <p className="mt-1 text-sm text-sage-500">
          和自己对话的地方 · 可选移植一株到广场与他人共享
        </p>
      </header>

      {/* 统计 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {moodKeys.map((m) => {
          const spec = PLANT_SPECIES[m]
          const count = garden?.stats[m] ?? 0
          return (
            <div
              key={m}
              className="rounded-xl border border-cream-200/70 bg-cream-50/80 p-3 text-center"
            >
              <div className="text-2xl">{spec.stages[3]}</div>
              <div className="mt-0.5 text-xs text-sage-500">{spec.name}</div>
              <div className="font-serif text-lg font-bold" style={{ color: spec.color }}>
                {count}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左：植物网格 */}
        <div className="relative overflow-hidden rounded-2xl border border-cream-200/70 bg-gradient-to-br from-forest-50/40 via-cream-50/60 to-sage-50/40 p-5 shadow-soft">
          <div className="absolute right-6 top-4 text-4xl opacity-70">🌞</div>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-forest-800">
              {garden?.plants.length ?? 0} 株植物
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-sage-500">
              <Droplets size={12} />
              浇水 {garden?.totalWater ?? 0} 次
            </div>
          </div>

          {!garden || garden.plants.length === 0 ? (
            <EmptyGarden />
          ) : (
            <div className="relative min-h-[280px]">
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                {plantPositions.map((p, i) => (
                  <PlantTile key={`${p.postId}-${i}`} plant={p} delay={i * 60} />
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-forest-100/40 to-transparent" />
            </div>
          )}

          {/* 图例 */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-cream-200/70 pt-4 text-[11px] text-sage-500">
            {STAGE_NAMES.map((name, stage) => (
              <span key={name} className="flex items-center gap-1">
                <span className="text-base">{PLANT_SPECIES.calm.stages[stage]}</span>
                {name}
              </span>
            ))}
            <span className="text-sage-400">· 每天自动 +1</span>
          </div>
        </div>

        {/* 右：发新日记 + 日记列表 */}
        <div className="space-y-4">
          {/* 发新种子 */}
          <div className="rounded-2xl border border-cream-200/70 bg-cream-50/80 p-4 shadow-soft">
            <h2 className="mb-2 flex items-center gap-1.5 font-serif text-sm font-bold text-forest-800">
              <Plus size={13} />
              种下一颗种子
            </h2>
            <Textarea
              placeholder="和自己说点什么…（只有你能看到）"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              maxLength={2000}
              className="bg-white/80 text-sm"
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setNewMood('')}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs',
                  newMood === '' ? 'bg-sage-200 text-sage-700' : 'bg-white/70 text-sage-500'
                )}
              >
                不选
              </button>
              {moodKeys.map((m) => {
                const meta = MOOD_META[m]
                const active = newMood === m
                return (
                  <button
                    key={m}
                    onClick={() => setNewMood(m)}
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
              <Button
                onClick={plant}
                disabled={submitting || !newContent.trim()}
                size="sm"
                className="ml-auto gap-1"
              >
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Sprout size={12} />}
                种下
              </Button>
            </div>
          </div>

          {/* 日记列表 */}
          {notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50/50 px-4 py-8 text-center text-xs text-sage-500">
              还没有日记 · 写下第一颗种子吧
            </div>
          ) : (
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {notes.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onWater={() => water(n.id)}
                  onTransplant={() => transplant(n)}
                  onDelete={() => remove(n.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PlantTile({ plant, delay }: { plant: PlantVO; delay: number }) {
  const spec = PLANT_SPECIES[plant.mood]
  if (!spec) return null
  const emoji = spec.stages[plant.stage]
  const scale = 0.7 + plant.stage * 0.25
  return (
    <div
      className="group relative flex aspect-square cursor-default flex-col items-center justify-end rounded-xl bg-white/40 transition-all duration-300 hover:bg-white/70"
      title={`${spec.name} · ${STAGE_NAMES[plant.stage]} · 浇过 ${plant.water} 次\n"${plant.snippet ?? ''}"`}
    >
      <span
        className="select-none"
        style={{
          fontSize: 'clamp(20px, 4vw, 32px)',
          transform: `scale(${scale})`,
          animation: `sway 4s ease-in-out infinite`,
          animationDelay: `${delay}ms`,
        }}
      >
        {emoji}
      </span>
      <span
        className="mb-0.5 text-[9px] font-medium opacity-60"
        style={{ color: spec.color }}
      >
        {plant.water > 0 && `💧${plant.water}`}
      </span>
    </div>
  )
}

function EmptyGarden() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="text-5xl opacity-60">🌱</div>
      <p className="font-serif text-base font-medium text-forest-800">
        你的花园还是一片荒地
      </p>
      <p className="text-xs text-sage-500">在右边写下第一颗种子</p>
    </div>
  )
}

function NoteCard({
  note,
  onWater,
  onTransplant,
  onDelete,
}: {
  note: GardenNoteVO
  onWater: () => void
  onTransplant: () => void
  onDelete: () => void
}) {
  const spec = note.mood ? PLANT_SPECIES[note.mood] : null
  const meta = note.mood ? MOOD_META[note.mood] : null
  return (
    <div className="rounded-xl border border-cream-200/70 bg-cream-50/80 p-3 shadow-soft">
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          {spec && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px]"
              style={{ backgroundColor: `${meta!.color}1A`, color: meta!.color }}
            >
              {spec.stages[note.stage]} {STAGE_NAMES[note.stage]}
            </span>
          )}
          <span className="text-sage-400">
            浇过 {note.waterCount} 次
          </span>
        </div>
        <span className="text-sage-400">
          {new Date(note.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <p className="mb-2 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-sage-700">
        {note.content}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          onClick={onWater}
          disabled={!note.canWater}
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-[11px] text-forest-600"
        >
          <Droplets size={11} />
          {note.canWater ? '浇水' : '今日已浇'}
        </Button>

        {note.transplanted && note.postId ? (
          <Link
            to={`/post/${note.postId}`}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-sage-50 px-2 py-1 text-[11px] font-medium text-sage-700 hover:bg-sage-100"
          >
            <ExternalLink size={10} />
            已显形广场
          </Link>
        ) : (
          <Button
            onClick={onTransplant}
            variant="ghost"
            size="sm"
            className="ml-auto h-7 gap-1 px-2 text-[11px] text-clay-600"
          >
            <Share2 size={11} />
            移植广场
          </Button>
        )}

        <button
          onClick={onDelete}
          className="rounded-full p-1.5 text-sage-400 transition-colors hover:bg-clay-50 hover:text-clay-500"
          aria-label="删除"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

function layoutPlants(plants: PlantVO[]): PlantVO[] {
  return [...plants].sort((a, b) => {
    if (a.mood !== b.mood) return a.mood.localeCompare(b.mood)
    return a.plantedAt.localeCompare(b.plantedAt)
  })
}
