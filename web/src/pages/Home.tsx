import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { postApi, PostVO } from '@/api/post'
import PostCard from '@/components/PostCard'
import DailyFortuneCard from '@/components/DailyFortuneCard'
import DailyTopicCard from '@/components/DailyTopicCard'
import EchoBanner from '@/components/EchoBanner'
import PlazaStatsBar from '@/components/PlazaStats'
import PostFilters, { POST_FILTERS, type FilterPreset } from '@/components/PostFilters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Leaf, PenLine, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'

export default function Home() {
  const [posts, setPosts] = useState<PostVO[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const size = 20

  // 筛选 Tab
  const [activeFilter, setActiveFilter] = useState<string>('new')
  const filterRef = useRef<FilterPreset>(POST_FILTERS[0])

  // 搜索
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = async (p: number, filter: FilterPreset, q: string = activeQuery) => {
    setLoading(true)
    try {
      const data = q.trim()
        ? await postApi.search(q.trim(), p, size, filter.params.type)
        : await postApi.list({ ...filter.params, page: p, size })
      setPosts(data.list)
      setTotal(data.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1, POST_FILTERS[0], '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onFilterChange = (preset: FilterPreset) => {
    setActiveFilter(preset.key)
    filterRef.current = preset
    load(1, preset)
  }

  // 输入防抖 400ms
  const onQueryChange = (v: string) => {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setActiveQuery(v)
      load(1, filterRef.current, v)
    }, 400)
  }

  const clearSearch = () => {
    setQuery('')
    setActiveQuery('')
    load(1, filterRef.current, '')
  }

  const totalPages = Math.max(1, Math.ceil(total / size))

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Hero 区：带浮动装饰的治愈标题 */}
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-cream-200/70 bg-gradient-to-br from-forest-50/60 via-cream-50/40 to-sage-50/40 p-8 text-center shadow-soft">
        {/* 装饰元素：四角浮动 emoji */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute left-[10%] top-[15%] animate-float text-2xl opacity-30">🍃</span>
          <span className="absolute right-[12%] top-[20%] animate-float text-2xl opacity-30" style={{ animationDelay: '1.5s' }}>🌙</span>
          <span className="absolute bottom-[15%] left-[20%] animate-float text-xl opacity-25" style={{ animationDelay: '2.5s' }}>✨</span>
          <span className="absolute bottom-[20%] right-[18%] animate-float text-xl opacity-25" style={{ animationDelay: '0.8s' }}>🌱</span>
        </div>

        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-cream-50/80 px-3 py-1 text-xs font-medium text-forest-700 backdrop-blur-sm">
            <Leaf size={12} className="animate-float text-forest-600" />
            一片可以安心说话的森林
          </div>
          <h1 className="font-serif text-4xl font-bold text-gradient-forest sm:text-5xl">
            树洞广场
          </h1>
          <p className="mt-2 text-sm text-sage-500">
            倾听他人的故事 · 或留下你的心事
          </p>
        </div>
      </section>

      {/* 共鸣信号 Banner（搜索时不展示，避免抢焦点） */}
      {!activeQuery && <EchoBanner />}

      {/* 统计概览条（搜索时不展示） */}
      {!activeQuery && <PlazaStatsBar />}

      {/* 搜索框 */}
      <div className="mb-4 relative">
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

      {/* 筛选 Tab（搜索时不展示，避免认知冲突） */}
      {!activeQuery && (
        <PostFilters active={activeFilter} onChange={onFilterChange} />
      )}

      {/* AI 每日运势（仅"最新" tab 展示，避免抢焦点） */}
      {!activeQuery && activeFilter === 'new' && <DailyFortuneCard />}

      {/* 每日话题（仅"最新" tab） */}
      {!activeQuery && activeFilter === 'new' && <DailyTopicCard />}

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

      {/* 帖子列表（桌面端 2 列，移动端 1 列） */}
      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            onClick={() => load(page - 1, filterRef.current)}
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
            onClick={() => load(page + 1, filterRef.current)}
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
