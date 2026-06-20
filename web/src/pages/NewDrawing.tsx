import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postApi } from '@/api/post'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import DrawingCanvas, { getCanvasHandle } from '@/components/DrawingCanvas'
import { AlertCircle, Loader2, Paintbrush } from 'lucide-react'

/**
 * 发涂鸦帖：postType=3，复用 tarot_data 字段存 base64 PNG。
 * 涂鸦帖在 PostCard / PostDetail 中以图片形式渲染。
 */
export default function NewDrawing() {
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [comment, setComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    nav('/login')
    return null
  }

  const submit = async () => {
    setError('')
    // 从 canvas DOM 拿 handle（canvas 是 DrawingCanvas 渲染的）
    const canvasEl = canvasContainerRef.current?.querySelector('canvas') ?? null
    const handle = getCanvasHandle(canvasEl)
    if (!handle || handle.isEmpty()) {
      setError('先画点什么吧 🌱')
      return
    }
    const dataUrl = handle.toDataURL()
    if (!dataUrl) {
      setError('画布读取失败')
      return
    }

    setLoading(true)
    try {
      // tarot_data 字段复用：存涂鸦元数据 + base64
      const tarotData = JSON.stringify({
        kind: 'drawing',
        image: dataUrl,  // base64 PNG
      })
      const content = comment.trim() || '一幅来自树洞的小画'
      const res = await postApi.create({
        content,
        isAnonymous,
        postType: 3,
        tarotData,
      })
      nav(`/post/${res.id}`)
    } catch (err: any) {
      setError(err?.message || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-6 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-clay-50 px-3 py-1 text-xs font-medium text-clay-600">
          <Paintbrush size={12} />
          画下此刻的心情
        </div>
        <h1 className="font-serif text-3xl font-bold text-forest-800">涂鸦树洞</h1>
      </header>

      <div
        ref={canvasContainerRef}
        className="card-sheen animate-fade-in rounded-2xl border border-cream-200/70 bg-cream-50/80 p-5 shadow-soft backdrop-blur-sm"
      >
        <DrawingCanvas />

        <Textarea
          placeholder="给这幅画配一句话？（可选）"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={500}
          className="mt-4 bg-white/80"
        />

        <div className="mt-4 flex items-center justify-between rounded-xl bg-cream-100/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{isAnonymous ? '🎭' : '🙂'}</span>
            <div>
              <Label htmlFor="anon-draw" className="cursor-pointer text-sage-700">
                {isAnonymous ? '匿名发布' : '实名发布'}
              </Label>
            </div>
          </div>
          <Switch id="anon-draw" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
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
              '发布到广场'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
