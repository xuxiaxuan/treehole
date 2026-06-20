import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { storyApi, type StoryVO } from '@/api/story'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { BookOpen, Loader2, Plus, Clock, Feather, Flag, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Stories() {
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [stories, setStories] = useState<StoryVO[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  // 创建表单
  const [title, setTitle] = useState('')
  const [opening, setOpening] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await storyApi.list(1, 30)
      setStories(data.list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async () => {
    setError('')
    if (!title.trim() || !opening.trim()) {
      setError('标题和开头都不能为空')
      return
    }
    setCreating(true)
    try {
      const res = await storyApi.create({
        title: title.trim(),
        opening: opening.trim(),
        isAnonymous,
      })
      setCreateOpen(false)
      setTitle('')
      setOpening('')
      nav(`/stories/${res.id}`)
    } catch (err: any) {
      setError(err?.message || '创建失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-forest-700">
            <BookOpen size={12} />
            多人接力 · 故事的下一段由你决定
          </div>
          <h1 className="font-serif text-3xl font-bold text-forest-800">协作故事</h1>
        </div>
        {user && (
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus size={15} />
            开个新故事
          </Button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-forest-400" />
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50/50 py-16 text-center">
          <div className="mb-3 text-3xl">📖</div>
          <p className="font-serif text-lg text-forest-800">还没有故事</p>
          <p className="mt-1 text-sm text-sage-500">
            {user ? '点击右上角「开个新故事」开始第一篇' : '登录后开启第一篇'}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {stories.map((s) => (
            <li key={s.id}>
              <Link
                to={`/stories/${s.id}`}
                className="card-sheen group block rounded-2xl border border-cream-200/70 bg-cream-50/80 p-5 transition-all hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-float"
              >
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="flex-1 font-serif text-lg font-bold text-forest-800 group-hover:text-forest-900">
                    {s.title}
                  </h2>
                  {s.status === 1 ? (
                    <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] text-sage-600">已完结</span>
                  ) : (
                    <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[10px] text-forest-700">进行中</span>
                  )}
                </div>
                <p className="mb-3 line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-sage-600">
                  {s.opening}
                </p>
                <div className="flex items-center gap-3 text-xs text-sage-400">
                  <span>{s.isAnonymous ? '匿名作者' : s.authorNickname}</span>
                  <span className="flex items-center gap-0.5">
                    <Feather size={11} />
                    {s.segmentCount} 段
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock size={11} />
                    {formatTime(s.updatedAt)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 创建故事 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-forest-800">
              <Feather size={16} className="text-clay-400" />
              开一个新故事
            </DialogTitle>
            <DialogDescription className="text-sage-500">
              写下故事的开头，让其他人接力续写
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="story-title" className="text-xs text-sage-600">标题</Label>
              <Input
                id="story-title"
                placeholder="一个吸引人的标题…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="story-opening" className="text-xs text-sage-600">开头（≤500 字）</Label>
              <Textarea
                id="story-opening"
                placeholder="很久很久以前…"
                value={opening}
                onChange={(e) => setOpening(e.target.value)}
                rows={5}
                maxLength={500}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-cream-100/60 px-3 py-2">
              <Switch id="story-anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <Label htmlFor="story-anon" className="text-xs text-sage-500">
                匿名发布
              </Label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              onClick={submit}
              disabled={creating || !title.trim() || !opening.trim()}
              className="w-full gap-1.5"
              size="lg"
            >
              {creating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  发布中…
                </>
              ) : (
                <>
                  <Send size={14} />
                  开始这篇故事
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} 天前`
  return new Date(iso).toLocaleDateString('zh-CN')
}
