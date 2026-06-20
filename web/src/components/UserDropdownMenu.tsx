import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from './Avatar'
import { useAuthStore } from '@/store/auth'
import { LogOut, User2, ChevronDown, Sprout, Bookmark } from 'lucide-react'

/**
 * 顶部导航用户菜单：头部信息 + 个人中心 + 退出登录。
 */
export function UserDropdownMenu() {
  const { user, logout } = useAuthStore()
  const nav = useNavigate()

  if (!user) return null

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 rounded-full bg-forest-50 py-1 pl-1 pr-2.5 transition-all hover:bg-forest-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50"
        >
          <Avatar avatarUrl={user.avatarUrl} nickname={user.nickname} size="sm" />
          <span className="hidden text-sm font-medium text-forest-800 sm:inline">
            {user.nickname}
          </span>
          <ChevronDown size={14} className="text-sage-500 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[220px] animate-fade-in rounded-2xl border border-cream-200 bg-cream-50 p-1.5 shadow-float"
        >
          {/* 头部信息 */}
          <div className="px-2.5 py-2">
            <div className="flex items-center gap-2.5">
              <Avatar avatarUrl={user.avatarUrl} nickname={user.nickname} size="md" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-forest-800">{user.nickname}</div>
                <div className="truncate text-xs text-sage-500">{user.email}</div>
              </div>
            </div>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-cream-200" />

          <DropdownMenu.Item asChild>
            <Link
              to="/profile"
              className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sage-700 outline-none data-[highlighted]:bg-forest-50 data-[highlighted]:text-forest-700"
            >
              <User2 size={14} />
              个人中心
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              to="/garden"
              className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sage-700 outline-none data-[highlighted]:bg-forest-50 data-[highlighted]:text-forest-700"
            >
              <Sprout size={14} />
              我的花园
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              to="/me/favorites"
              className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sage-700 outline-none data-[highlighted]:bg-forest-50 data-[highlighted]:text-forest-700"
            >
              <Bookmark size={14} />
              我的收藏
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => {
              logout()
              nav('/login')
            }}
            className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-clay-600 outline-none data-[highlighted]:bg-clay-50"
          >
            <LogOut size={14} />
            退出登录
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default UserDropdownMenu
