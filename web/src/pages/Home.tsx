import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { postApi, PostVO } from '@/api/post'
import PostCard from '@/components/PostCard'
import DailyFortuneCard from '@/components/DailyFortuneCard'
import DailyTopicCard from '@/components/DailyTopicCard'
import EchoBanner from '@/components/EchoBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Leaf, PenLine, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'

export default function Home() {
  const [posts, setPosts] = useState<PostVO[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const size = 20

  // 搜索
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = async (p: number, q: string = activeQuery) => {
    setLoading(true)
    try {
      const data = q.trim()
        ? await postApi.search(q.trim(), p, size)
        : await postApi.list(p, size)
      setPosts(data.list)
      setTotal(data.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 输入防抖 400ms
  const onQueryChange = (v: string) => {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setActiveQuery(v)
      load(1, v)
    }, 400)
  }

  const clearSearch = () => {
    setQuery('')
    setActiveQuery('')
    load(1, '')
  }

  const totalPages = Math.max(1, Math.ceil(total / size))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Hero 区：治愈系标题 */}
      <section className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-forest-700">
          <Leaf size={12} className="animate-float" />
          一片可以安心说话的森林
        </div>
        <h1 className="font-serif text-3xl font-bold text-forest-800 sm:text-4xl">
          广场
        </h1>
        <p className="mt-2 text-sm text-sage-500">
          倾听他人的故事，或留下你的心事
        </p>
      </section>

      {/* 共鸣信号 Banner（搜索时不展示，避免抢焦点） */}
      {!activeQuery && <EchoBanner />}

      {/* 搜索框 */}
      <div className="mb-6 relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" />
        <Input
          placeholder="搜索广场上的树洞…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-9 pr-9 bg-cream-50/80"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-sage-400 transition-colors hover:bg-cream-100 hover:text-sage-600"
            aria-label="清除"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* AI 每日运势（仅登录用户可见；搜索时不展示避免抢焦点） */}
      {!activeQuery && <DailyFortuneCard />}

      {/* 每日话题（搜索时不展示） */}
      {!activeQuery && <DailyTopicCard />}

      {/* 当前搜索状态提示 */}
      {activeQuery && (
        <div className="mb-4 rounded-xl bg-cream-100/60 px-3 py-2 text-xs text-sage-600">
          {loading ? (
            <span className="flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" />
              搜索中…
            </span>
          ) : (
            <>「<b className="text-forest-700">{activeQuery}</b>」的搜索结果 · 共 {total} 条</>
          )}
        </div>
      )}

      {/* 加载骨架 */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-6 w-6 animate-spin text-forest-400" />
          <p className="text-sm text-sage-400">正在搜集森林里的回响…</p>
        </div>
      )}

      {/* 空状态 */}
      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-cream-300 bg-cream-50/50 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-50 text-3xl">
            {activeQuery ? '🔍' : '🌱'}
          </div>
          <div>
            <p className="font-serif text-lg font-medium text-forest-800">
              {activeQuery ? `没有找到「${activeQuery}」相关的内容` : '这里还很安静'}
            </p>
            <p className="mt-1 text-sm text-sage-500">
              {activeQuery ? '换个关键词试试' : '成为第一个种下心声的人吧'}
            </p>
          </div>
          {!activeQuery && (
            <Link to="/new">
              <Button className="gap-1.5">
                <PenLine size={15} />
                发个树洞
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* 帖子列表 */}
      {!loading && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {/* 分页 */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="gap-1"
          >
            <ChevronLeft size={16} />
            上一页
          </Button>
          <span className="min-w-[64px] text-center text-sm text-sage-500">
            <span className="font-medium text-forest-700">{page}</span>
            <span className="mx-1">/</span>
            {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => load(page + 1)}
            className="gap-1"
          >
            下一页
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
