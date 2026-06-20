import { useEffect, useRef, useState } from 'react'
import { danmakuApi, type DanmakuVO } from '@/api/danmaku'
import { useAuthStore } from '@/store/auth'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Send, MessageCircle, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 弹幕层：浮在帖子详情顶部，多条弹幕分 lane 滚动。
 * 10s 轮询加载新弹幕；用户可发送弹幕（≤30 字）。
 *
 * 简化版：CSS animation 滚动；不做严格碰撞检测（lane 由后端分配）。
 */
const LANE_COUNT = 10
const LANE_HEIGHT = 32 // px
const ANIMATION_DURATION = 12 // 秒

export default function DanmakuOverlay({ postId }: { postId: number }) {
  const user = useAuthStore((s) => s.user)
  const nav = useNavigate()
  const [danmaku, setDanmaku] = useState<DanmakuVO[]>([])
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [sending, setSending] = useState(false)
  const lastIdRef = useRef<number | null>(null)

  // 初次加载 + 轮询
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const list = await danmakuApi.list(postId)
        if (!mounted) return
        // 仅追加新弹幕（id 大于 lastId）
        const lastId = lastIdRef.current
        const fresh = lastId === null ? list : list.filter((d) => d.id > lastId)
        if (fresh.length > 0) {
          setDanmaku((prev) => [...prev, ...fresh])
          lastIdRef.current = fresh[fresh.length - 1].id
        }
      } catch {
        // 静默
      }
    }
    load()
    const t = setInterval(load, 10_000)
    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [postId])

  const send = async () => {
    if (!user) {
      nav('/login')
      return
    }
    if (!content.trim() || sending) return
    setSending(true)
    try {
      const res = await danmakuApi.send(postId, {
        content: content.trim(),
        isAnonymous,
      })
      // 立即把这条加到本地（不等下次轮询）
      setDanmaku((prev) => [
        ...prev,
        {
          id: res.id,
          content: content.trim(),
          color: '#3d7a4d',
          isAnonymous,
          createdAt: new Date().toISOString(),
          lane: res.id % LANE_COUNT,
          authorNickname: isAnonymous ? undefined : user.nickname ?? undefined,
        },
      ])
      lastIdRef.current = res.id
      setContent('')
    } finally {
      setSending(false)
    }
  }

  // 只展示最近 50 条（避免 DOM 爆炸）
  const visible = danmaku.slice(-50)

  return (
    <>
      {/* 弹幕轨道层（固定在帖子详情顶部） */}
      <div className="pointer-events-none relative z-10 mb-4 h-[160px] overflow-hidden rounded-2xl border border-cream-200/70 bg-gradient-to-br from-forest-50/40 via-cream-50/30 to-sage-50/30 backdrop-blur-sm">
        {visible.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-sage-400">
            还没有弹幕，发一条试试 🌱
          </div>
        ) : (
          visible.map((d) => (
            <div
              key={d.id}
              className="absolute whitespace-nowrap text-sm font-medium"
              style={{
                top: `${d.lane * LANE_HEIGHT + 8}px`,
                color: d.color,
                animation: `danmaku-scroll ${ANIMATION_DURATION}s linear`,
                // 通过 animation-delay 错峰，避免完全重叠
                animationDelay: `${(d.id % 5) * 0.4}s`,
                textShadow: '0 1px 2px rgba(255,255,255,0.6)',
              }}
            >
              {d.content}
            </div>
          ))
        )}

        {/* 右上角开关 */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="pointer-events-auto absolute right-2 top-2 flex items-center gap-1 rounded-full bg-cream-50/80 px-2.5 py-1 text-xs text-sage-600 shadow-soft transition hover:bg-cream-50"
        >
          <MessageCircle size={11} />
          发弹幕
        </button>
      </div>

      {/* 弹幕发送面板 */}
      {open && (
        <div className="mb-4 rounded-2xl border border-cream-200/70 bg-cream-50/90 p-3 shadow-soft backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Input
              placeholder="说点什么…（≤30 字）"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={30}
              className="bg-white/80"
              onKeyDown={(e) => {
                if (e.key === 'Enter') send()
              }}
            />
            <div className="flex items-center gap-1">
              <Switch id="dm-anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <Label htmlFor="dm-anon" className="hidden text-xs text-sage-500 sm:inline">
                匿名
              </Label>
            </div>
            <Button onClick={send} disabled={sending || !content.trim()} size="sm" className="gap-1">
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              发送
            </Button>
            <Button
              onClick={() => setOpen(false)}
              size="sm"
              variant="ghost"
              className="px-2"
              aria-label="关闭"
            >
              <X size={14} />
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-sage-400">
            {content.length}/30 · 每 10 秒自动刷新新弹幕
          </p>
        </div>
      )}
    </>
  )
}
