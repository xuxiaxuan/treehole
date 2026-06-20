import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { postApi } from '@/api/post'
import { MOOD_META, type MoodKey } from '@/api/mood'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Feather, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NewPost() {
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)

  const topicTitle = searchParams.get('topicTitle') || ''
  const topicDate = searchParams.get('topicDate') || ''

  // 话题预填：用户从今日话题进入时，content 自动带话题前缀
  const initialContent = topicTitle ? `#今日话题 「${topicTitle}」\n\n` : ''
  const [content, setContent] = useState(initialContent)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [mood, setMood] = useState<MoodKey | ''>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    nav('/login')
    return null
  }

  const submit = async () => {
    if (!content.trim()) {
      setError('内容不能为空')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await postApi.create({
        content,
        isAnonymous,
        mood: mood || undefined,
      })
      nav(`/post/${res.id}`)
    } catch (err: any) {
      setError(err.message || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  const exitTopicMode = () => {
    setSearchParams({})
    setContent('')
  }

  const charCount = content.length
  const max = 2000

  const moodKeys = Object.keys(MOOD_META) as MoodKey[]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-forest-700">
          <Feather size={12} />
          说出来，会好受一些
        </div>
        <h1 className="font-serif text-3xl font-bold text-forest-800">发个树洞</h1>
      </div>

      {/* 话题模式提示 */}
      {topicTitle && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-clay-200 bg-clay-50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-clay-600">#今日话题</span>
            <span className="text-sm text-forest-800">{topicTitle}</span>
            {topicDate && <span className="text-xs text-sage-400">· {topicDate}</span>}
          </div>
          <button
            onClick={exitTopicMode}
            className="rounded-full p-1 text-sage-400 transition-colors hover:bg-cream-100 hover:text-sage-600"
            aria-label="退出话题模式"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="card-sheen animate-fade-in rounded-2xl border border-cream-200/70 bg-cream-50/80 p-6 shadow-soft backdrop-blur-sm">
        <Textarea
          placeholder="此刻在想什么？这里没有人会评判你…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          maxLength={max}
          className="min-h-[200px] text-[15px] leading-relaxed"
        />

        {/* 字符计数 */}
        <div className="mt-2 flex justify-end">
          <span className={`text-xs ${charCount > max * 0.9 ? 'text-clay-500' : 'text-sage-400'}`}>
            {charCount} / {max}
          </span>
        </div>

        {/* 匿名开关 */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-cream-100/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{isAnonymous ? '🎭' : '🙂'}</span>
            <div>
              <Label htmlFor="anon" className="cursor-pointer text-sage-700">
                {isAnonymous ? '匿名发布' : '实名发布'}
              </Label>
              <p className="text-xs text-sage-400">
                {isAnonymous ? '别人看不到你的昵称' : '展示你的昵称'}
              </p>
            </div>
          </div>
          <Switch id="anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
        </div>

        {/* 心情选择器 */}
        <div className="mt-4 rounded-xl bg-cream-100/60 px-4 py-3">
          <div className="mb-2 text-xs text-sage-500">
            此刻心情（可选 · 会出现在「心情热力图」）
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setMood('')}
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-all',
                mood === ''
                  ? 'bg-sage-200 text-sage-700'
                  : 'bg-white/70 text-sage-500 hover:bg-white'
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
                    'flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-all',
                    'hover:scale-105',
                    active ? 'text-white shadow-soft' : 'bg-white/70 text-sage-500 hover:bg-white'
                  )}
                  style={active ? { backgroundColor: meta.color } : undefined}
                >
                  <span>{meta.emoji}</span>
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-clay-200 bg-clay-50 px-3 py-2.5 text-sm text-clay-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => nav(-1)}>
            取消
          </Button>
          <Button onClick={submit} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                发布中…
              </>
            ) : (
              '发布'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
