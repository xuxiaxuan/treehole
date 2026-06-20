import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { PenLine } from 'lucide-react'
import { UserDropdownMenu } from './UserDropdownMenu'
import NotificationBell from './NotificationBell'
import { ToolsHub } from './ToolsHub'

/**
 * 顶部导航：精简版
 * 主操作只有「发帖」，其余治愈小功能统一收纳进「工具箱」下拉。
 */
export default function Navbar() {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="sticky top-0 z-40 border-b border-cream-200/70 bg-cream-50/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Logo：森林墨绿 + 树洞意象 */}
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-gradient text-lg shadow-soft transition-transform duration-300 group-hover:scale-105">
            <span className="animate-float inline-block">🌳</span>
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-lg font-bold text-forest-800">树洞广场</span>
            <span className="text-[10px] tracking-wider text-sage-400">Treehole · 倾诉与治愈</span>
          </div>
        </Link>

        {/* 右侧操作区：工具箱 + 通知 + 发帖 + 用户菜单 */}
        <div className="flex items-center gap-1.5">
          <ToolsHub />

          {user ? (
            <>
              <NotificationBell />
              <Link to="/new">
                <Button size="sm" className="gap-1.5">
                  <PenLine size={15} />
                  <span className="hidden sm:inline">发帖</span>
                </Button>
              </Link>
              <UserDropdownMenu />
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  登录
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">注册</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
