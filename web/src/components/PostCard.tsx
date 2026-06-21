import { Link } from 'react-router-dom'
import { PostVO, postApi, isDrawingData, isWordleData, type DrawingPostData, type WordlePostData } from '@/api/post'
import { MOOD_META, type MoodKey } from '@/api/mood'
import { useAuthStore } from '@/store/auth'
import { useTarotThemeStore } from '@/store/tarotTheme'
import { TAROT_THEMES } from '@/lib/tarotThemes'
import { Heart, Clock, Paintbrush, Gamepad2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Avatar } from './Avatar'

/**
 * 心情标签 chip：颜色取自 MOOD_META，保持与发帖页/热力图一致。
 * 仅在 post.mood 有值时渲染。
 */
export function MoodBadge({ mood }: { mood?: MoodKey | null }) {
  if (!mood) return null
  const meta = MOOD_META[mood]
  if (!meta) return null
  return (
    <span
      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
      title={`心情：${meta.label}`}
    >
      <span aria-hidden="true">{meta.emoji}</span>
      {meta.label}
    </span>
  )
}

// 帖子卡片：奶白底 + 暖边框 + 头像 + 标签 + 治愈互动栏
export default function PostCard({ post: initial }: { post: PostVO }) {
  const [post, setPost] = useState(initial)
  const user = useAuthStore((s) => s.user)
  const [liking, setLiking] = useState(false)
  const themeId = useTarotThemeStore((s) => s.theme)
  const theme = TAROT_THEMES[themeId]

  const like = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    if (liking) return
    setLiking(true)
    try {
      const res = await postApi.like(post.id)
      setPost({ ...post, liked: res.liked, likeCount: res.likeCount })
    } catch (e) {
      // 静默
    } finally {
      setLiking(false)
    }
  }

  const isTarot = post.postType === 1
  const isDrawing = post.postType === 3
  const isWordle = post.postType === 2
  const author = post.isAnonymous ? '匿名旅人' : post.authorNickname

  // 涂鸦帖：从 tarotData 提取图片 base64（类型守卫替代 as any）
  const drawingData = isDrawing && isDrawingData(post.tarotData)
    ? post.tarotData as DrawingPostData
    : null
  const drawingImage = drawingData?.image ?? null

  // Wordle 帖：从 tarotData 提取 emoji 数组（类型守卫）
  const wordleData = isWordle && isWordleData(post.tarotData)
    ? post.tarotData as WordlePostData
    : null
  const wordleEmoji = wordleData?.emoji ?? null

  return (
    <article
      className="card-sheen group animate-fade-in rounded-2xl border border-cream-200/70 bg-cream-50/80 p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-float"
    >
      {/* 头部：作者信息 */}
      <div className="mb-3 flex items-center gap-3">
        {post.isAnonymous ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-200 text-sm shadow-soft">
            🎭
          </span>
        ) : (
          <Avatar
            avatarUrl={post.authorAvatarUrl}
            nickname={post.authorNickname}
            size="md"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-sage-700">{author}</span>
          <span className="flex items-center gap-1 text-xs text-sage-400">
            <Clock size={11} />
            {formatTime(post.createdAt)}
          </span>
        </div>
        {isTarot && (
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
              theme.badgeClass
            )}
            title={theme.name}
          >
            <span aria-hidden="true">{theme.emoji}</span>
            塔罗
          </span>
        )}
        {isDrawing && (
          <span className="flex items-center gap-1 rounded-full bg-clay-50 px-2.5 py-1 text-xs font-medium text-clay-600">
            <Paintbrush size={11} />
            涂鸦
          </span>
        )}
        {isWordle && (
          <span className="flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 text-xs font-medium text-forest-700">
            <Gamepad2 size={11} />
            Wordle
          </span>
        )}
      </div>

      {/* 心情标签（独立一行，仅在有 mood 时展示） */}
      {post.mood && (
        <div className="mb-3">
          <MoodBadge mood={post.mood} />
        </div>
      )}

      {/* 正文 */}
      <Link to={`/post/${post.id}`} className="block">
        {drawingImage ? (
          // 涂鸦帖：图片 + 简短文字（如有）
          <div className="mb-3 space-y-3">
            <img
              src={drawingImage}
              alt="涂鸦"
              className="w-full rounded-xl border border-cream-200 bg-cream-50"
              loading="lazy"
            />
            {post.content && post.content !== '一幅来自树洞的小画' && (
              <p className="whitespace-pre-wrap text-sm text-sage-600">{post.content}</p>
            )}
          </div>
        ) : wordleEmoji ? (
          // Wordle 帖：emoji 棋盘 + 文字
          <div className="mb-3 space-y-2">
            <pre className="rounded-xl bg-cream-100/60 p-3 font-mono text-xs whitespace-pre-wrap text-sage-700">
              {wordleEmoji.join('\n')}
            </pre>
            <p className="line-clamp-3 whitespace-pre-wrap text-[15px] leading-relaxed text-sage-700">
              {post.content}
            </p>
          </div>
        ) : (
          <p className="mb-4 line-clamp-4 whitespace-pre-wrap text-[15px] leading-relaxed text-sage-700 transition-colors group-hover:text-forest-800">
            {post.content}
          </p>
        )}
      </Link>

      {/* 互动栏 */}
      <div className="flex items-center justify-between border-t border-cream-200/70 pt-3">
        <button
          onClick={like}
          disabled={liking}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200',
            'hover:scale-105 active:scale-95 disabled:opacity-50',
            post.liked
              ? 'text-clay-500 hover:bg-clay-50'
              : 'text-sage-500 hover:bg-forest-50 hover:text-forest-700'
          )}
        >
          <Heart
            size={16}
            className={cn('transition-all duration-200', post.liked && 'fill-clay-400 text-clay-500')}
          />
          <span>{post.likeCount}</span>
        </button>
        <Link
          to={`/post/${post.id}`}
          className="text-xs font-medium text-sage-400 transition-colors hover:text-forest-600"
        >
          查看详情 →
        </Link>
      </div>
    </article>
  )
}

// 相对时间格式化（治愈系语气）
function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
