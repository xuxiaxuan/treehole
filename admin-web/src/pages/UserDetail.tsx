import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Tag,
  Button,
  Descriptions,
  Statistic,
  Row,
  Col,
  Space,
  message,
  Typography,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { adminApi, type AdminUserDetail } from '@/api/admin'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface PostRow {
  id: number
  content: string
  postType: number
  likeCount: number
  status: number
  isAnonymous: boolean
  authorNickname: string
  createdAt: string
}

const STATUS_CONFIG: Record<number, { label: string; color: string }> = {
  0: { label: '正常', color: 'success' },
  1: { label: '隐藏', color: 'warning' },
  2: { label: '删除', color: 'error' },
}

/**
 * 用户详情页：基础信息 + 统计 + 发帖历史（含匿名帖真实作者）。
 * 自保护：管理员角色不可封禁（前端禁用 + 后端拒绝）。
 */
export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()

  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [posts, setPosts] = useState<PostRow[]>([])
  const [postTotal, setPostTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const loadDetail = async () => {
    if (!id) return
    try {
      const d: any = await adminApi.getUserDetail(Number(id))
      setDetail(d)
    } catch (e: any) {
      message.error(e.message || '加载失败')
    }
  }

  const loadPosts = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res: any = await adminApi.listUserPosts(Number(id), { page, size: 20 })
      setPosts(res.list)
      setPostTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page])

  const toggleStatus = async () => {
    if (!detail) return
    const newStatus = detail.status === 0 ? 1 : 0
    try {
      await adminApi.updateUserStatus(detail.id, newStatus)
      message.success(newStatus === 1 ? '已封禁' : '已解禁')
      loadDetail()
    } catch (e: any) {
      message.error(e.message || '操作失败')
    }
  }

  const columns: ColumnsType<PostRow> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (v, r) => (
        <Space size={6}>
          {r.isAnonymous && (
            <Tag color="default" bordered={false}>
              匿
            </Tag>
          )}
          <span style={{ color: '#2a3530' }}>{v}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'postType',
      width: 80,
      render: (v) =>
        v === 1 ? (
          <Tag color="gold" bordered={false}>
            塔罗
          </Tag>
        ) : (
          <Tag color="green" bordered={false}>
            树洞
          </Tag>
        ),
    },
    { title: '点赞', dataIndex: 'likeCount', width: 70, align: 'center' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v) => {
        const cfg = STATUS_CONFIG[v] ?? { label: '—', color: 'default' }
        return (
          <Tag color={cfg.color} bordered={false}>
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (v) => new Date(v).toLocaleString(),
    },
  ]

  const isAdmin = detail?.role === 1

  return (
    <div>
      <div
        style={{
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/users')}>
          返回
        </Button>
        <div>
          <Title
            level={4}
            className="font-serif-cn"
            style={{ marginBottom: 4, color: '#1f3f2a' }}
          >
            用户详情
          </Title>
          <Text style={{ color: '#6a7d70', fontSize: 13 }}>
            审视这位森林访客的足迹
          </Text>
        </div>
      </div>

      {detail && (
        <>
          <Card
            style={{
              borderRadius: 14,
              border: '1px solid #ece3d3',
              marginBottom: 16,
            }}
            styles={{ body: { padding: 24 } }}
          >
            <Row gutter={24} align="middle">
              <Col flex="auto">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{detail.email}</Descriptions.Item>
                  <Descriptions.Item label="昵称">{detail.nickname}</Descriptions.Item>
                  <Descriptions.Item label="角色">
                    {detail.role === 1 ? (
                      <Tag color="gold">管理员</Tag>
                    ) : (
                      <Tag>普通用户</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    {detail.status === 0 ? (
                      <Tag color="success">正常</Tag>
                    ) : (
                      <Tag color="error">封禁</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="注册时间">
                    {new Date(detail.createdAt).toLocaleString()}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col flex="none">
                <Space direction="vertical" size={8}>
                  <Button
                    danger={detail.status === 0}
                    type={detail.status === 0 ? 'default' : 'primary'}
                    onClick={toggleStatus}
                    disabled={isAdmin}
                  >
                    {detail.status === 0 ? '封禁' : '解禁'}
                  </Button>
                  {isAdmin && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      管理员不可封禁
                    </Text>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card style={{ borderRadius: 14, border: '1px solid #ece3d3' }}>
                <Statistic title="发帖总数" value={detail.postCount ?? 0} />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ borderRadius: 14, border: '1px solid #ece3d3' }}>
                <Statistic title="收到点赞" value={detail.likeReceivedTotal ?? 0} />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ borderRadius: 14, border: '1px solid #ece3d3' }}>
                <Statistic
                  title="被举报次数"
                  value={detail.reportCount ?? 0}
                  valueStyle={{
                    color: detail.reportCount > 0 ? '#cf1322' : undefined,
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title="发帖历史（含匿名帖真实作者）"
            style={{ borderRadius: 14, border: '1px solid #ece3d3' }}
          >
            <Table
              rowKey="id"
              columns={columns}
              dataSource={posts}
              loading={loading}
              pagination={{
                current: page,
                total: postTotal,
                pageSize: 20,
                onChange: setPage,
                showTotal: (t) => `共 ${t} 条`,
              }}
            />
          </Card>
        </>
      )}
    </div>
  )
}
