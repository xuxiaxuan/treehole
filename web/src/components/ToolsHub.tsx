import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Sprout,
  Hourglass,
  Moon,
  Gamepad2,
  BookOpen,
  Activity,
  Paintbrush,
  ChevronDown,
  LayoutGrid,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

/**
 * 树洞工具箱：收纳所有非主流程的治愈小功能，避免 Navbar 拥挤。
 * - 桌面端：点击按钮 → 弹出 4 列网格
 * - 移动端：自适应 2-3 列
 *
 * 收纳的功能：塔罗 / 花园 / 胶囊 / 共鸣 / Wordle / 故事 / 热力图 / 涂鸦
 */
const TOOLS = [
  { to: '/tarot', icon: Sparkles, title: '塔罗占卜', desc: '抽 3 张牌', color: '#c95c3e', loginRequired: false },
  { to: '/garden', icon: Sprout, title: '心情花园', desc: '私人日记', color: '#3d7a4d', loginRequired: true },
  { to: '/capsules', icon: Hourglass, title: '时间胶囊', desc: '写给未来', color: '#9b7bb8', loginRequired: true },
  { to: '/echo', icon: Moon, title: '共鸣信号', desc: '相似灵魂', color: '#7c5fa3', loginRequired: false },
  { to: '/wordle', icon: Gamepad2, title: '每日 Wordle', desc: '猜词游戏', color: '#5a8bb5', loginRequired: false },
  { to: '/stories', icon: BookOpen, title: '协作故事', desc: '共同创作', color: '#7fb069', loginRequired: false },
  { to: '/moods', icon: Activity, title: '心情热力图', desc: '情绪分布', color: '#d4a373', loginRequired: false },
  { to: '/new-drawing', icon: Paintbrush, title: '涂鸦画板', desc: '自由创作', color: '#c9a04a', loginRequired: true },
]

export function ToolsHub() {
  const user = useAuthStore((s) => s.user)
  const tools = TOOLS.filter((t) => !t.loginRequired || user)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="group flex items-center gap-1.5 rounded-full bg-forest-50 py-1.5 pl-2.5 pr-2 text-sm font-medium text-forest-800 transition-all hover:bg-forest-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50"
        >
          <LayoutGrid size={14} className="text-forest-600" />
          <span className="hidden sm:inline">工具箱</span>
          <ChevronDown
            size={13}
            className="text-sage-500 transition-transform group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="center"
          sideOffset={8}
          className="z-50 animate-fade-in rounded-2xl border border-cream-200 bg-cream-50 p-3 shadow-float"
        >
          <div className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-sage-400">
            树洞治愈工具箱
          </div>
          <div className="grid w-[min(90vw,420px)] grid-cols-2 gap-1.5 sm:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon
              return (
                <DropdownMenu.Item asChild key={tool.to}>
                  <Link
                    to={tool.to}
                    className={cn(
                      'group flex cursor-pointer select-none flex-col gap-1 rounded-xl bg-white/60 p-2.5 outline-none',
                      'transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-soft',
                      'data-[highlighted]:bg-white data-[highlighted]:shadow-soft'
                    )}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${tool.color}1A` }}
                    >
                      <Icon size={14} style={{ color: tool.color }} />
                    </span>
                    <span className="text-xs font-medium text-forest-800">{tool.title}</span>
                    <span className="text-[10px] text-sage-400">{tool.desc}</span>
                  </Link>
                </DropdownMenu.Item>
              )
            })}
          </div>
          <div className="mt-2 px-1 text-[10px] text-sage-400">
            {user ? '· 登录后可用更多工具' : '· 部分工具需要登录'}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default ToolsHub
