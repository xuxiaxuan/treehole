import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { storyApi, type StoryVO } from '@/api/story'
import { useAuthStore } from '@/store/auth'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Clock,
  Feather,
  Flag,
  Loader2,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** 故事详情页：开头 + 续写段落（按时间正序）+ 续写输入框 + 15s 轮询 */
export default function StoryDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [story, setStory] = useState<StoryVO | null>(null)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const lastSegIdRef = useRef<number | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const data = await storyApi.detail(Number(id))
      setStory(data)
      // 拉到新段落时滚动到底部
      const last = data.segments?.[data.segments.length - 1]?.id
      if (last && last !== lastSegIdRef.current && lastSegIdRef.current !== null) {
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        }, 100)
      }
      lastSegIdRef.current = last ?? null
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
    // 轮询：15 秒拉一次新段落（仅当故事进行中）
    const t = setInterval(() => {
      if (story?.status === 0) load()
    }, 15_000)
    return () => clearInterval(t)
  }, [load, story?.status])

  const submit = async () => {
    setError('')
    if (!user) {
      nav('/login')
      return
    }
    if (!content.trim() || submitting) return
    setSubmitting(true)
    try {
      await storyApi.appendSegment(Number(id), {
        content: content.trim(),
        isAnonymous,
      })
      setContent('')
      await load()
    } catch (err: any) {
      setError(err?.message || '续写失败')
    } finally {
      setSubmitting(false)
    }
  }

  const finish = async () => {
    if (!confirm('确定完结这个故事？完结后不能再续写。')) return
    try {
      await storyApi.finish(Number(id))
      await load()
    } catch (err: any) {
      setError(err?.message || '完结失败')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-forest-400" />
      </div>
    )
  }

  if (!story) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sage-500">
        故事不存在或已删除。<Link to="/stories" className="ml-2 text-forest-600 hover:underline">返回列表</Link>
      </div>
    )
  }

  const author = story.isAnonymous ? '匿名作者' : story.authorNickname
  const canFinish = user && story.authorId === user.id && story.status === 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/stories"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-500 transition-colors hover:text-forest-700"
      >
        <ArrowLeft size={15} />
        所有故事
      </Link>

      {/* 标题区 */}
      <header className="mb-6 rounded-2xl border border-cream-200/70 bg-cream-50/80 p-6 shadow-soft backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="flex-1 font-serif text-2xl font-bold text-forest-800 sm:text-3xl">
            {story.title}
          </h1>
          {story.status === 1 ? (
            <span className="rounded-full bg-sage-100 px-2.5 py-1 text-xs text-sage-600">已完结</span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 text-xs text-forest-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest-500" />
              进行中
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-sage-500">
          <span className="flex items-center gap-1.5">
            <Avatar
              avatarUrl={story.isAnonymous ? undefined : story.authorAvatarUrl}
              nickname={author}
              size="sm"
            />
            {author}
          </span>
          <span className="flex items-center gap-1">
            <Feather size={11} />
            {story.segmentCount} 段
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatTime(story.createdAt)} 开始
          </span>
          {canFinish && (
            <Button
              variant="ghost"
              size="sm"
              onClick={finish}
              className="ml-auto gap-1 text-xs text-clay-500 hover:bg-clay-50"
            >
              <Flag size={11} />
              完结
            </Button>
          )}
        </div>
      </header>

      {/* 开头段落 */}
      <article className="card-sheen mb-4 rounded-2xl border border-cream-200/70 bg-white/70 p-5 shadow-soft">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-forest-100 px-2 py-0.5 text-[10px] font-medium text-forest-700">
            开头
          </span>
          <span className="text-xs text-sage-400">{author}</span>
        </div>
        <p className="whitespace-pre-wrap text-[15px] leading-loose text-sage-700">
          {story.opening}
        </p>
      </article>

      {/* 续写段落 */}
      {story.segments?.map((seg, i) => (
        <article
          key={seg.id}
          className="card-sheen mb-3 animate-fade-in rounded-2xl border border-cream-200/70 bg-white/70 p-5 shadow-soft"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md bg-clay-50 px-2 py-0.5 text-[10px] font-medium text-clay-600">
              第 {i + 2} 段
            </span>
            <span className="text-xs text-sage-400">
              {seg.isAnonymous ? '匿名' : seg.authorNickname}
            </span>
            <span className="ml-auto text-[10px] text-sage-400">{formatTime(seg.createdAt)}</span>
          </div>
          <p className="whitespace-pre-wrap text-[15px] leading-loose text-sage-700">
            {seg.content}
          </p>
        </article>
      ))}

      {/* 续写输入框（仅进行中） */}
      {story.status === 0 ? (
        <div className="sticky bottom-4 mt-6 rounded-2xl border border-cream-200/70 bg-cream-50/95 p-4 shadow-float backdrop-blur-xl">
          {user ? (
            <>
              <Textarea
                placeholder="续写一段…（≤200 字）"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                maxLength={200}
                className="bg-white/80"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="seg-anon"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                  <Label htmlFor="seg-anon" className="text-xs text-sage-500">
                    匿名续写
                  </Label>
                  <span className="text-xs text-sage-400">{content.length}/200</span>
                </div>
                <Button
                  onClick={submit}
                  disabled={submitting || !content.trim()}
                  size="sm"
                  className="gap-1.5"
                >
                  {submitting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  续写
                </Button>
              </div>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </>
          ) : (
            <div className="py-2 text-center text-sm text-sage-500">
              <Link to="/login" className="text-forest-600 hover:underline">登录</Link> 后参与续写
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-sage-200 bg-sage-50/60 p-6 text-center text-sm text-sage-600">
          🌿 故事已完结 · 感谢所有参与的作者
        </div>
      )}
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
