import { Sparkles, Flame, Drama, Sprout, Paintbrush, Gamepad2 } from 'lucide-react'
import type { PostListParams } from '@/api/post'
import { cn } from '@/lib/utils'

/**
 * 帖子筛选 Tab：单选模式，每次只激活一个预设。
 * 预设包含 sort/type/anonymous 组合，简化用户认知。
 */
export interface FilterPreset {
  key: string
  label: string
  icon: React.ReactNode
  params: PostListParams
}

export const POST_FILTERS: FilterPreset[] = [
  { key: 'new', label: '最新', icon: <Sparkles size={12} />, params: { sort: 'new' } },
  { key: 'hot', label: '热门', icon: <Flame size={12} />, params: { sort: 'hot' } },
  { key: 'anon', label: '匿名', icon: <Drama size={12} />, params: { anonymous: true } },
  { key: 'tarot', label: '塔罗', icon: <Sparkles size={12} />, params: { type: 1 } },
  { key: 'drawing', label: '涂鸦', icon: <Paintbrush size={12} />, params: { type: 3 } },
  { key: 'wordle', label: 'Wordle', icon: <Gamepad2 size={12} />, params: { type: 2 } },
  { key: 'treehole', label: '树洞', icon: <Sprout size={12} />, params: { type: 0 } },
]

export default function PostFilters({
  active,
  onChange,
}: {
  active: string
  onChange: (preset: FilterPreset) => void
}) {
  return (
    <div className="mb-5 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-1.5">
        {POST_FILTERS.map((f) => {
          const isActive = active === f.key
          return (
            <button
              key={f.key}
              onClick={() => onChange(f)}
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                'hover:scale-105 active:scale-95',
                isActive
                  ? 'bg-forest-gradient text-cream-50 shadow-soft'
                  : 'bg-cream-50/80 text-sage-600 hover:bg-cream-100'
              )}
            >
              <span className={cn(isActive ? 'text-cream-50' : 'text-sage-400')}>
                {f.icon}
              </span>
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
