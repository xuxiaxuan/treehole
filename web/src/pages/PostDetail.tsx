import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { postApi, PostVO, WarmReplyVO } from '@/api/post'
import { ffApi } from '@/api/favorite-follow'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Heart, Clock, ArrowLeft, Flag, Sparkles, Loader2, MessageCircleHeart, Bookmark, UserPlus, UserCheck } from 'lucide-react'
import ReportDialog from '@/components/ReportDialog'
import TarotCardMini from '@/components/TarotCardMini'
import CommentSection from '@/components/CommentSection'
import DanmakuOverlay from '@/components/DanmakuOverlay'
import { MoodBadge } from '@/components/PostCard'
import { useTarotThemeStore } from '@/store/tarotTheme'
import { TAROT_THEMES } from '@/lib/tarotThemes'
import { getCardIconByName } from '@/lib/tarotIcons'
import { cn } from '@/lib/utils'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const [post, setPost] = useState<PostVO | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [liking, setLiking] = useState(false)
  const themeId = useTarotThemeStore((s) => s.theme)
  const theme = TAROT_THEMES[themeId]

  // AI 暖心回复相关
  const [warmOpen, setWarmOpen] = useState(false)
  const [warmLoading, setWarmLoading] = useState(false)
  const [warmReply, setWarmReply] = useState<WarmReplyVO | null>(null)
  const [warmError, setWarmError] = useState<string | null>(null)

  // 收藏 + 关注
  const [favorited, setFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    postApi.detail(Number(id)).then((p) => {
      setPost(p)
      // 登录用户 + 实名帖 + 非自己 → 查是否已关注作者
      if (user && p && !p.isAnonymous && p.authorId && p.authorId !== user.id) {
        ffApi.followInfo(p.authorId).then((info) => setFollowing(info.following)).catch(() => {})
      }
    })
  }, [id, user?.id])

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-6 w-6 animate-spin text-forest-400" />
        <p className="text-sm text-sage-400">正在打开这则树洞…</p>
      </div>
    )
  }

  const like = async () => {
    if (liking) return
    setLiking(true)
    try {
      const res = await postApi.like(post.id)
      setPost({ ...post, liked: res.liked, likeCount: res.likeCount })
    } finally {
      setLiking(false)
    }
  }

  const openWarmReply = async () => {
    setWarmOpen(true)
    setWarmReply(null)
    setWarmError(null)
    setWarmLoading(true)
    try {
      const res = await postApi.warmReply(post.id)
      setWarmReply(res)
    } catch (err: any) {
      setWarmError(err?.message || '生成失败，请稍后重试')
    } finally {
      setWarmLoading(false)
    }
  }

  const toggleFavorite = async () => {
    if (!user) return
    if (favLoading) return
    setFavLoading(true)
    try {
      const res = await ffApi.toggleFavorite(post.id)
      setFavorited(res.favorited)
    } finally {
      setFavLoading(false)
    }
  }

  const toggleFollow = async () => {
    if (!user || !post.authorId) return
    if (followLoading) return
    setFollowLoading(true)
    try {
      const res = await ffApi.toggleFollow(post.authorId)
      setFollowing(res.following)
    } finally {
      setFollowLoading(false)
    }
  }

  const isTarot = post.postType === 1
  const author = post.isAnonymous ? '匿名旅人' : post.authorNickname
  const avatarText = post.isAnonymous ? '🎭' : (post.authorNickname?.[0] ?? '?')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-500 transition-colors hover:text-forest-700"
      >
        <ArrowLeft size={15} />
        回到广场
      </Link>

      {/* 弹幕层 */}
      <DanmakuOverlay postId={post.id} />

      <article className="card-sheen animate-fade-in rounded-2xl border border-cream-200/70 bg-cream-50/80 p-6 shadow-soft backdrop-blur-sm sm:p-8">
        {/* 作者信息 */}
        <div className="mb-5 flex items-center gap-3 border-b border-cream-200/70 pb-5">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-medium shadow-soft',
              post.isAnonymous ? 'bg-cream-200 text-sage-600' : 'bg-forest-gradient text-cream-50'
            )}
          >
            {avatarText}
          </span>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-medium text-sage-700">{author}</span>
            <span className="flex items-center gap-1 text-xs text-sage-400">
              <Clock size={11} />
              {new Date(post.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
          {isTarot && (
            <span className="flex items-center gap-1 rounded-full bg-clay-50 px-2.5 py-1 text-xs font-medium text-clay-600">
              <Sparkles size={11} />
              塔罗
            </span>
          )}
        </div>

        {/* 正文 */}
        <p className="mb-5 whitespace-pre-wrap text-[15px] leading-loose text-sage-700">
          {post.content}
        </p>

        {/* 心情标签（仅在有 mood 时展示） */}
        {post.mood && (
          <div className="mb-5">
            <MoodBadge mood={post.mood} />
          </div>
        )}

        {/* 塔罗牌展示 */}
        {isTarot && post.tarotData && (
          <div className={cn('mb-5 rounded-xl border p-4', theme.cardBorderClass, 'bg-clay-50/60')}>
            <div className={cn('mb-3 flex items-center gap-1.5 text-xs font-medium', theme.cardTextClass)}>
              <Sparkles size={12} />
              抽到的牌 · {theme.name}
            </div>
            <div className="flex flex-wrap gap-2">
              {(post.tarotData as any).cards?.map((c: any, i: number) => (
                <TarotCardMini
                  key={i}
                  name={c.name}
                  nameEn={c.nameEn}
                  icon={getCardIconByName(c.name, c.nameEn)}
                  isReversed={!!c.isReversed}
                  theme={theme}
                  size="md"
                />
              ))}
            </div>
          </div>
        )}

        {/* 互动栏 */}
        <div className="flex items-center gap-2 border-t border-cream-200/70 pt-5">
          <button
            onClick={like}
            disabled={liking}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
              'hover:scale-105 active:scale-95 disabled:opacity-50',
              post.liked
                ? 'bg-clay-50 text-clay-500'
                : 'text-sage-500 hover:bg-forest-50 hover:text-forest-700'
            )}
          >
            <Heart
              size={18}
              className={cn('transition-all duration-200', post.liked && 'fill-clay-400 text-clay-500')}
            />
            {post.likeCount}
          </button>

          {/* AI 暖心回复 */}
          <button
            onClick={openWarmReply}
            disabled={warmLoading}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
              'hover:scale-105 active:scale-95 disabled:opacity-50',
              'text-forest-600 hover:bg-forest-50 hover:text-forest-700'
            )}
          >
            {warmLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MessageCircleHeart size={16} />
            )}
            暖心回复
          </button>

          {/* 收藏 */}
          {user && (
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                'hover:scale-105 active:scale-95 disabled:opacity-50',
                favorited
                  ? 'bg-sage-50 text-sage-700'
                  : 'text-sage-500 hover:bg-sage-50 hover:text-sage-700'
              )}
            >
              {favLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Bookmark size={16} className={cn(favorited && 'fill-sage-500 text-sage-600')} />
              )}
              {favorited ? '已收藏' : '收藏'}
            </button>
          )}

          {/* 关注作者（仅实名帖+非自己+登录） */}
          {user && !post.isAnonymous && post.authorId && post.authorId !== user.id && (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                'hover:scale-105 active:scale-95 disabled:opacity-50',
                following
                  ? 'bg-sage-100 text-sage-600'
                  : 'bg-forest-gradient text-cream-50 shadow-soft'
              )}
            >
              {followLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : following ? (
                <UserCheck size={12} />
              ) : (
                <UserPlus size={12} />
              )}
              {following ? '已关注' : '关注作者'}
            </button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReportOpen(true)}
            className="ml-auto gap-1.5 text-sage-400"
          >
            <Flag size={14} />
            举报
          </Button>
        </div>
      </article>

      {/* AI 暖心回复 Dialog */}
      <Dialog open={warmOpen} onOpenChange={setWarmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-forest-800">
              <MessageCircleHeart size={18} className="text-clay-400" />
              AI 暖心回复
            </DialogTitle>
            <DialogDescription className="text-sage-500">
              让 AI 用温柔的话语陪伴这一则树洞
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {warmLoading && (
              <div className="flex items-center justify-center gap-2 py-8 text-sage-500">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">AI 正在倾听…</span>
              </div>
            )}

            {warmReply && (
              <div
                className={cn(
                  'rounded-2xl p-4 text-[15px] leading-loose',
                  warmReply.fallback
                    ? 'bg-cream-100/70 text-sage-600'
                    : 'bg-gradient-to-br from-cream-100/80 to-forest-50/60 text-sage-800'
                )}
              >
                {warmReply.reply}
                {warmReply.fallback && (
                  <div className="mt-2 text-xs text-sage-400">
                    （AI 服务暂不可用，以上是兜底文案）
                  </div>
                )}
              </div>
            )}

            {warmError && (
              <p className="text-sm text-red-600">{warmError}</p>
            )}

            {warmReply && !warmReply.fallback && (
              <Button
                onClick={openWarmReply}
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                disabled={warmLoading}
              >
                <Sparkles size={13} />
                再来一句
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 评论区 */}
      <div className="mt-6 animate-fade-in rounded-2xl border border-cream-200/70 bg-cream-50/60 p-5 backdrop-blur-sm sm:p-6">
        <CommentSection postId={post.id} />
      </div>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} postId={post.id} />
    </div>
  )
}
