import { useEffect, useState, useCallback } from 'react'
import { commentApi, type CommentVO } from '@/api/comment'
import { useAuthStore } from '@/store/auth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/Avatar'
import {
  Heart,
  Loader2,
  MessageSquare,
  CornerDownRight,
  Trash2,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** 评论区：包含发表框 + 列表（2 级嵌套） */
export default function CommentSection({ postId }: { postId: number }) {
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [list, setList] = useState<CommentVO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // 顶层发表框
  const [topContent, setTopContent] = useState('')
  const [topAnon, setTopAnon] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await commentApi.list(postId, page, 20)
      setList((prev) => (page === 1 ? res.list : [...prev, ...res.list]))
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [postId, page])

  useEffect(() => {
    load()
  }, [load])

  const submitTop = async () => {
    if (!user) {
      nav('/login')
      return
    }
    if (!topContent.trim() || submitting) return
    setSubmitting(true)
    try {
      await commentApi.create(postId, {
        content: topContent.trim(),
        isAnonymous: topAnon,
      })
      setTopContent('')
      setPage(1)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  /** 子组件回调：刷新单条评论（点赞/删除/新增回复后局部更新） */
  const refreshAll = async () => {
    setPage(1)
    await load()
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare size={18} className="text-clay-400" />
        <h2 className="font-serif text-lg font-bold text-forest-800">
          评论 <span className="text-sm font-normal text-sage-400">({total})</span>
        </h2>
      </div>

      {/* 顶层发表框 */}
      <div className="mb-6 rounded-2xl border border-cream-200/70 bg-cream-50/60 p-4">
        <Textarea
          placeholder={user ? '写下你的想法…' : '登录后参与评论'}
          value={topContent}
          onChange={(e) => setTopContent(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={!user}
          className="bg-white/80"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch id="anon-comment" checked={topAnon} onCheckedChange={setTopAnon} disabled={!user} />
            <Label htmlFor="anon-comment" className="text-xs text-sage-500">
              匿名评论
            </Label>
          </div>
          <Button onClick={submitTop} disabled={submitting || !user || !topContent.trim()} size="sm" className="gap-1.5">
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            发表
          </Button>
        </div>
      </div>

      {/* 评论列表 */}
      {loading && page === 1 ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-sage-400" />
        </div>
      ) : list.length === 0 ? (
        <div className="py-8 text-center text-sm text-sage-400">
          还没有评论，留下第一条声音吧 🌱
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((c) => (
            <CommentItem
              key={c.id}
              postId={postId}
              comment={c}
              currentUser={user}
              onChanged={refreshAll}
            />
          ))}
        </ul>
      )}

      {/* 加载更多 */}
      {!loading && list.length < total && (
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)}>
            加载更多（剩余 {total - list.length} 条）
          </Button>
        </div>
      )}
    </section>
  )
}

// ============================================================
// 单条评论（含子回复）
// ============================================================

function CommentItem({
  postId,
  comment,
  currentUser,
  onChanged,
  isChild = false,
}: {
  postId: number
  comment: CommentVO
  currentUser: { id: number } | null
  onChanged: () => void | Promise<void>
  isChild?: boolean
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyAnon, setReplyAnon] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [liking, setLiking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const nav = useNavigate()

  const author = comment.isAnonymous ? '匿名用户' : comment.authorNickname ?? '未知用户'
  const avatarText = comment.isAnonymous ? '🎭' : (comment.authorNickname?.[0] ?? '?')

  const onLike = async () => {
    if (!currentUser) {
      nav('/login')
      return
    }
    if (liking) return
    setLiking(true)
    try {
      await commentApi.like(comment.id)
      await onChanged()
    } finally {
      setLiking(false)
    }
  }

  const onDelete = async () => {
    if (!confirm('确定删除这条评论吗？')) return
    setDeleting(true)
    try {
      await commentApi.delete(comment.id)
      await onChanged()
    } finally {
      setDeleting(false)
    }
  }

  const submitReply = async () => {
    if (!currentUser || !replyContent.trim() || submitting) return
    setSubmitting(true)
    try {
      // 父评论是一级评论 → 我发的就是二级回复；parentId 用 comment.parentId ?? comment.id
      // （若当前 comment 本身就是回复，parentId 仍指向它的一级父；replyToUserId 指向 comment 的作者）
      const parentId = comment.parentId ?? comment.id
      const replyToUserId = isChild ? comment.authorId : null
      await commentApi.create(postId, {
        content: replyContent.trim(),
        parentId,
        replyToUserId,
        isAnonymous: replyAnon,
      })
      setReplyContent('')
      setReplyOpen(false)
      await onChanged()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <li className={cn(isChild && 'ml-10 border-l border-cream-200/70 pl-4')}>
      <div className="rounded-xl bg-white/70 p-3">
        <div className="mb-1.5 flex items-center gap-2">
          <Avatar avatarUrl={comment.authorAvatarUrl} nickname={author} size="sm" />
          <span className="text-sm font-medium text-sage-700">{author}</span>
          {/* @ 目标用户（第 3 级平铺） */}
          {isChild && comment.replyToNickname && (
            <span className="text-xs text-sage-400">
              回复 <span className="text-forest-600">@{comment.replyToNickname}</span>
            </span>
          )}
          <span className="ml-auto text-xs text-sage-400">{formatTime(comment.createdAt)}</span>
        </div>

        <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', comment.deleted ? 'italic text-sage-400' : 'text-sage-700')}>
          {comment.content}
        </p>

        {!comment.deleted && (
          <div className="mt-2 flex items-center gap-3 text-xs text-sage-500">
            <button
              onClick={onLike}
              disabled={liking}
              className={cn(
                'flex items-center gap-1 transition-colors disabled:opacity-50',
                comment.liked ? 'text-clay-500' : 'hover:text-clay-500'
              )}
            >
              {liking ? <Loader2 size={12} className="animate-spin" /> : <Heart size={12} className={cn(comment.liked && 'fill-clay-400')} />}
              {comment.likeCount > 0 && comment.likeCount}
            </button>

            {currentUser && (
              <button
                onClick={() => setReplyOpen((v) => !v)}
                className="flex items-center gap-1 transition-colors hover:text-forest-600"
              >
                <CornerDownRight size={12} />
                回复
              </button>
            )}

            {comment.canDelete && (
              <button
                onClick={onDelete}
                disabled={deleting}
                className="ml-auto flex items-center gap-1 transition-colors hover:text-red-500 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                删除
              </button>
            )}
          </div>
        )}

        {/* 回复输入框 */}
        {replyOpen && currentUser && (
          <div className="mt-3 rounded-lg bg-cream-50/80 p-2.5">
            <Textarea
              placeholder={`回复 ${author}…`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              maxLength={500}
              className="bg-white/80 text-sm"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={replyAnon} onCheckedChange={setReplyAnon} id={`anon-${comment.id}`} />
                <Label htmlFor={`anon-${comment.id}`} className="text-xs text-sage-500">
                  匿名
                </Label>
              </div>
              <Button onClick={submitReply} disabled={submitting || !replyContent.trim()} size="sm">
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                回复
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 子回复列表（仅一级评论渲染） */}
      {!isChild && comment.children && comment.children.length > 0 && (
        <ul className="mt-3 space-y-3">
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              postId={postId}
              comment={child}
              currentUser={currentUser}
              onChanged={onChanged}
              isChild
            />
          ))}
        </ul>
      )}
    </li>
  )
}

// ============================================================
// 工具
// ============================================================

/** 简单相对时间：7 天内显示"x 分钟前/小时前/天前"，否则显示 yyyy-MM-dd */
function formatTime(iso: string): string {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString('zh-CN')
}
