import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ffApi } from '@/api/favorite-follow'
import type { PostVO } from '@/api/post'
import PostCard from '@/components/PostCard'
import { Button } from '@/components/ui/button'
import { Loader2, Bookmark, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'

export default function MyFavorites() {
  const [posts, setPosts] = useState<PostVO[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const size = 20

  const load = async (p: number) => {
    setLoading(true)
    try {
      const data = await ffApi.myFavorites(p, size)
      setPosts(data.list)
      setTotal(data.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [])

  const totalPages = Math.max(1, Math.ceil(total / size))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/profile"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-500 transition-colors hover:text-forest-700"
      >
        <ArrowLeft size={15} />
        返回个人中心
      </Link>

      <header className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-forest-800">
          <Bookmark size={22} className="text-sage-500" />
          我的收藏
        </h1>
        <p className="mt-1 text-sm text-sage-500">你收藏过的所有帖子（共 {total} 条）</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-forest-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50/50 py-16 text-center text-sm text-sage-400">
          还没有收藏任何帖子<br />
          <Link to="/" className="mt-2 inline-block text-forest-600 hover:underline">去广场逛逛 →</Link>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {posts.map((p) => (
              <li key={p.id}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="text-sm text-sage-500">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => load(page + 1)}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
