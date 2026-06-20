import { useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Dropdown, Space, Typography } from 'antd'
import {
  LogoutOutlined,
  DownOutlined,
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  TeamOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'
import { Avatar } from './Avatar'

const { Header, Sider, Content } = AntLayout

export default function Layout() {
  const { user, token, logout } = useAuthStore()
  const nav = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!token || !user || user.role !== 1) {
      nav('/login')
    }
  }, [token, user, nav])

  if (!user || user.role !== 1) return null

  // 侧边栏菜单：使用 icon 显得精致
  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">数据看板</Link> },
    { key: '/posts', icon: <FileTextOutlined />, label: <Link to="/posts">帖子管理</Link> },
    { key: '/reports', icon: <WarningOutlined />, label: <Link to="/reports">举报队列</Link> },
    { key: '/users', icon: <TeamOutlined />, label: <Link to="/users">用户管理</Link> },
  ]

  // 当前路径选中态（/users/123 也高亮 /users）
  const firstSeg = location.pathname.split('/')[1] ?? 'posts'
  const selectedKey = '/' + firstSeg

  // 用户下拉菜单
  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '管理员中心',
        onClick: () => nav('/profile'),
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          logout()
          nav('/login')
        },
      },
    ],
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        style={{
          borderRight: '1px solid #ece3d3',
          boxShadow: '4px 0 24px -16px rgba(20, 42, 28, 0.12)',
        }}
      >
        {/* Logo 区 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '20px 20px 24px',
            borderBottom: '1px solid #f3ecdb',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #3d7a4d 0%, #1f3f2a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fdfaf6',
              fontSize: 20,
              boxShadow: '0 2px 12px -2px rgba(20, 42, 28, 0.2)',
            }}
          >
            <span style={{ fontSize: 20 }}>🌳</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span
              className="font-serif-cn"
              style={{ fontSize: 16, fontWeight: 700, color: '#1f3f2a' }}
            >
              树洞管理台
            </span>
            <span style={{ fontSize: 11, color: '#8a9b8e', letterSpacing: 0.5 }}>
              Treehole Admin
            </span>
          </div>
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ border: 'none', background: 'transparent', padding: '0 8px' }}
          items={menuItems}
        />
      </Sider>

      <AntLayout>
        <Header
          style={{
            background: '#fffdf9',
            borderBottom: '1px solid #ece3d3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            boxShadow: '0 1px 0 rgba(20, 42, 28, 0.04)',
          }}
        >
          <Typography.Text style={{ color: '#4f5f54', fontSize: 14 }}>
            欢迎回来，守护这片森林 🌿
          </Typography.Text>

          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <Space
              style={{
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 999,
                background: '#f7f1e8',
                transition: 'all 0.2s',
              }}
            >
              <Avatar
                avatarUrl={user.avatarUrl}
                nickname={user.nickname}
                size={28}
              />
              <span style={{ fontSize: 13, color: '#285233', fontWeight: 500 }}>
                {user.nickname}
              </span>
              <DownOutlined style={{ fontSize: 10, color: '#8a9b8e' }} />
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ padding: 24, overflow: 'auto' }}>
          <div className="fade-in">
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
