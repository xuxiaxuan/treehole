import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, message, Card, Typography, Popconfirm } from 'antd'
import { adminApi } from '@/api/admin'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface ReportRow {
  id: number
  reporterId: number
  postId: number
  reason: string
  status: number
  createdAt: string
}

export default function Reports() {
  const [data, setData] = useState<ReportRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await adminApi.listReports({ page, size: 20, status: 0 })
      setData(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])

  const dismiss = async (id: number) => {
    await adminApi.resolveReport(id, 'dismiss')
    message.success('已忽略')
    load()
  }

  const deletePost = async (id: number, postId: number) => {
    await adminApi.resolveReport(id, 'delete_post', postId)
    message.success('已删帖')
    load()
  }

  const columns: ColumnsType<ReportRow> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '帖子 ID', dataIndex: 'postId', width: 100 },
    {
      title: '举报理由',
      dataIndex: 'reason',
      render: (v) => <span style={{ color: '#2a3530' }}>{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (v) =>
        v === 0 ? (
          <Tag color="warning" bordered={false}>待处理</Tag>
        ) : (
          <Tag color="default" bordered={false}>已处理</Tag>
        ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v) => new Date(v).toLocaleString(),
    },
    {
      title: '操作',
      width: 200,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" onClick={() => dismiss(r.id)}>
            忽略
          </Button>
          {/* 破坏性操作必须有确认弹窗，避免误触 */}
          <Popconfirm
            title="删除该帖子？"
            description="此操作不可撤销"
            okText="删帖"
            cancelText="取消"
            onConfirm={() => deletePost(r.id, r.postId)}
          >
            <Button size="small" danger>
              删帖
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
          举报队列
        </Title>
        <Text style={{ color: '#6a7d70', fontSize: 13 }}>查看用户举报，守护社区氛围</Text>
      </div>

      <Card
        style={{ borderRadius: 14, border: '1px solid #ece3d3' }}
        styles={{ body: { padding: 20 } }}
      >
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
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>
    </div>
  )
}
