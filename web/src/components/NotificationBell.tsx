import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { notificationApi, type NotificationVO } from '@/api/notification'
import { Avatar } from '@/components/Avatar'
import { Bell, Heart, MessageSquare, CornerDownRight, UserPlus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 通知铃铛：Navbar 右上角。
 * - 每 60s 轮询未读数；用户操作后立即刷新
 * - 点击展开 Dropdown 列表（最多 20 条），底部"全部已读"按钮
 */
export default function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const [list, setList] = useState<NotificationVO[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [marking, setMarking] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // 轮询未读数（60s）
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const r = await notificationApi.unreadCount()
        setUnread(r.unreadCount)
      } catch {
        // 静默
      }
    }
    fetchUnread()
    const t = setInterval(fetchUnread, 60_000)
    return () => clearInterval(t)
  }, [])

  // 点击外部关闭
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const openDropdown = async () => {
    if (!open) {
      setOpen(true)
      setLoading(true)
      try {
        const r = await notificationApi.list(1, 20)
        setList(r.list)
      } finally {
        setLoading(false)
      }
    } else {
      setOpen(false)
    }
  }

  const markAllRead = async () => {
    setMarking(true)
    try {
      await notificationApi.readAll()
      setUnread(0)
      setList((prev) => prev.map((n) => ({ ...n, read: true })))
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={openDropdown}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-sage-500 transition-colors hover:bg-forest-50 hover:text-forest-700"
        aria-label="通知"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay-500 px-1 text-[10px] font-bold text-cream-50">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-[70vh] overflow-hidden rounded-2xl border border-cream-200/70 bg-cream-50/95 shadow-float backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-cream-200/70 px-4 py-2.5">
            <span className="text-sm font-medium text-forest-800">通知</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={marking}
                className="flex items-center gap-1 text-xs text-sage-500 transition-colors hover:text-forest-700 disabled:opacity-50"
              >
                <Check size={11} />
                全部已读
              </button>
            )}
          </div>

          <div className="max-h-[55vh] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-xs text-sage-400">加载中…</div>
            ) : list.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-sage-400">
                还没有通知<br />有人和你互动时，会出现在这里
              </div>
            ) : (
              list.map((n) => <NotificationItem key={n.id} n={n} onClose={() => setOpen(false)} />)
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ n, onClose }: { n: NotificationVO; onClose: () => void }) {
  const actor = n.actorNickname || '匿名用户'
  const icon = iconForType(n.type)
  const text = textForType(n.type, actor)

  return (
    <Link
      to={n.postId ? `/post/${n.postId}` : '/'}
      onClick={onClose}
      className={cn(
        'flex items-start gap-2.5 border-b border-cream-100/60 px-4 py-2.5 transition-colors hover:bg-cream-100/50',
        !n.read && 'bg-forest-50/40'
      )}
    >
      <Avatar avatarUrl={n.actorAvatarUrl} nickname={actor} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          <span className="shrink-0 text-sage-400">{icon}</span>
          <p className="flex-1 text-xs leading-relaxed text-sage-700">
            {text}
            {n.snippet && (
              <span className="mt-0.5 block truncate text-[11px] text-sage-400">「{n.snippet}」</span>
            )}
          </p>
        </div>
        <span className="mt-0.5 block text-[10px] text-sage-400">{formatTime(n.createdAt)}</span>
      </div>
      {!n.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-500" />}
    </Link>
  )
}

function iconForType(type: NotificationVO['type']) {
  const map = {
    like_post: <Heart size={12} className="text-clay-400" />,
    comment: <MessageSquare size={12} className="text-forest-500" />,
    reply: <CornerDownRight size={12} className="text-forest-500" />,
    follow: <UserPlus size={12} className="text-sage-500" />,
  } as const
  return map[type] ?? <Bell size={12} />
}

function textForType(type: NotificationVO['type'], actor: string): React.ReactNode {
  switch (type) {
    case 'like_post':
      return <><b className="font-medium">{actor}</b> 赞了你的帖子</>
    case 'comment':
      return <><b className="font-medium">{actor}</b> 评论了你的帖子</>
    case 'reply':
      return <><b className="font-medium">{actor}</b> 回复了你的评论</>
    case 'follow':
      return <><b className="font-medium">{actor}</b> 关注了你</>
    default:
      return <>{actor} 与你有新互动</>
  }
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
