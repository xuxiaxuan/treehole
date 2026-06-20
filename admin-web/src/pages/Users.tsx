import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Input, Select, Space, Button, Tag, Popconfirm, message, Card, Typography } from 'antd'
import { adminApi } from '@/api/admin'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface UserRow {
  id: number
  email: string
  nickname: string
  role: number
  status: number
  createdAt: string
}

export default function Users() {
  const nav = useNavigate()
  const [data, setData] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<number | undefined>(undefined)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await adminApi.listUsers({ page, size: 20, status, keyword })
      setData(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, status])

  const toggleStatus = async (r: UserRow) => {
    const newStatus = r.status === 0 ? 1 : 0
    await adminApi.updateUserStatus(r.id, newStatus)
    message.success(newStatus === 1 ? '已封禁' : '已解禁')
    load()
  }

  const toggleRole = async (r: UserRow) => {
    const newRole = r.role === 1 ? 0 : 1
    await adminApi.updateUserRole(r.id, newRole)
    message.success(newRole === 1 ? '已提升为管理员' : '已撤销管理员')
    load()
  }

  const columns: ColumnsType<UserRow> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '邮箱',
      dataIndex: 'email',
      render: (v) => <span style={{ color: '#2a3530' }}>{v}</span>,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      render: (v) => <span style={{ color: '#2a3530' }}>{v}</span>,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 110,
      render: (v) =>
        v === 1 ? (
          <Tag color="gold" bordered={false}>管理员</Tag>
        ) : (
          <Tag color="default" bordered={false}>普通</Tag>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v) =>
        v === 0 ? (
          <Tag color="success" bordered={false}>正常</Tag>
        ) : (
          <Tag color="error" bordered={false}>封禁</Tag>
        ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v) => new Date(v).toLocaleString(),
    },
    {
      title: '操作',
      width: 300,
      render: (_, r) => (
        <Space size={4} wrap>
          <Button size="small" onClick={() => nav(`/users/${r.id}`)}>
            查看
          </Button>
          <Popconfirm
            title={r.status === 0 ? '确定封禁？' : '确定解禁？'}
            okText="确认"
            cancelText="取消"
            onConfirm={() => toggleStatus(r)}
          >
            <Button size="small" danger={r.status === 0}>
              {r.status === 0 ? '封禁' : '解禁'}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={r.role === 0 ? '提升为管理员？' : '撤销管理员？'}
            okText="确认"
            cancelText="取消"
            onConfirm={() => toggleRole(r)}
          >
            <Button size="small" type="primary" ghost>
              {r.role === 0 ? '设为管理员' : '撤销管理员'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} className="font-serif-cn" style={{ marginBottom: 4, color: '#1f3f2a' }}>
          用户管理
        </Title>
        <Text style={{ color: '#6a7d70', fontSize: 13 }}>管理森林访客的权限与状态</Text>
      </div>

      <Card
        style={{ borderRadius: 14, border: '1px solid #ece3d3' }}
        styles={{ body: { padding: 20 } }}
      >
        <Space style={{ marginBottom: 16 }} size={12} wrap>
          <Input.Search
            placeholder="搜索邮箱 / 昵称"
            allowClear
            onSearch={(v) => {
              setKeyword(v)
              setPage(1)
              load()
            }}
            style={{ width: 300 }}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            onChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
            options={[
              { value: 0, label: '正常' },
              { value: 1, label: '封禁' },
            ]}
          />
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
            showTotal: (t) => `共 ${t} 位用户`,
          }}
        />
      </Card>
    </div>
  )
}
