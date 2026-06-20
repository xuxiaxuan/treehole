import { useEffect, useState } from 'react'
import {
  Table,
  Input,
  Select,
  Space,
  Button,
  Popconfirm,
  message,
  Card,
  Tag,
  Tooltip,
  Typography,
  Modal,
} from 'antd'
import { ThunderboltFilled, ReloadOutlined, CommentOutlined } from '@ant-design/icons'
import { adminApi, type CommentRow } from '@/api/admin'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text, Paragraph } = Typography

interface PostRow {
  id: number
  content: string
  postType: number
  likeCount: number
  status: number
  isAnonymous: boolean
  authorNickname: string
  aiSummary?: string | null
  aiTags?: string | null
  createdAt: string
}

// 状态标签配置：治愈系暖调配色
const STATUS_CONFIG: Record<number, { label: string; color: string }> = {
  0: { label: '正常', color: 'success' },
  1: { label: '隐藏', color: 'warning' },
  2: { label: '删除', color: 'error' },
}

export default function Posts() {
  const [data, setData] = useState<PostRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<number | undefined>(undefined)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingId, setGeneratingId] = useState<number | null>(null)

  // 评论管理 Modal 状态
  const [commentModalPostId, setCommentModalPostId] = useState<number | null>(null)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [commentTotal, setCommentTotal] = useState(0)
  const [commentLoading, setCommentLoading] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await adminApi.listPosts({ page, size: 20, status, keyword })
      setData(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, status])

  const updateStatus = async (id: number, newStatus: number) => {
    await adminApi.updatePostStatus(id, newStatus)
    message.success('已更新')
    load()
  }

  /** 触发 AI 摘要生成；503（AI 不可用）时给出明确提示 */
  const generateSummary = async (id: number) => {
    setGeneratingId(id)
    try {
      const res = await adminApi.generateAiSummary(id)
      // 就地更新当前行，避免整页 reload
      setData((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                aiSummary: res.summary,
                aiTags: (res.tags || []).join(','),
              }
            : row
        )
      )
      message.success('AI 摘要已生成')
    } catch (err: any) {
      message.error(err?.message || '生成失败，请稍后重试')
    } finally {
      setGeneratingId(null)
    }
  }

  /** 打开评论管理 Modal */
  const openComments = async (postId: number) => {
    setCommentModalPostId(postId)
    setCommentLoading(true)
    try {
      const res = await adminApi.listComments(postId, { page: 1, size: 100 })
      // 把嵌套 children 拍平展示（管理员视角）
      const flat: CommentRow[] = []
      const collect = (list: CommentRow[], depth: number) => {
        for (const c of list) {
          flat.push({ ...c, content: depth > 0 ? '  '.repeat(depth) + '↳ ' + c.content : c.content })
          if ((c as any).children) collect((c as any).children, depth + 1)
        }
      }
      collect(res.list as any[], 0)
      setComments(flat)
      setCommentTotal(res.total)
    } catch (err: any) {
      message.error(err?.message || '加载评论失败')
    } finally {
      setCommentLoading(false)
    }
  }

  /** 管理员删除评论（status=2 软删） */
  const deleteComment = async (id: number) => {
    setDeletingCommentId(id)
    try {
      await adminApi.deleteComment(id)
      message.success('已删除')
      if (commentModalPostId) {
        await openComments(commentModalPostId)
      }
    } catch (err: any) {
      message.error(err?.message || '删除失败')
    } finally {
      setDeletingCommentId(null)
    }
  }

  const columns: ColumnsType<PostRow> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (v, r) => (
        <Space size={6}>
          {r.isAnonymous && <Tag color="default" bordered={false}>匿</Tag>}
          <span style={{ color: '#2a3530' }}>{v}</span>
        </Space>
      ),
    },
    {
      title: 'AI 摘要',
      dataIndex: 'aiSummary',
      width: 220,
      render: (v: string | null | undefined) =>
        v ? (
          <Tooltip title={v} placement="topLeft">
            <Text ellipsis style={{ color: '#4f5f54', maxWidth: 200, fontSize: 12 }}>
              {v}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            未生成
          </Text>
        ),
    },
    {
      title: 'AI 标签',
      dataIndex: 'aiTags',
      width: 160,
      render: (v: string | null | undefined) => {
        if (!v) {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              —
            </Text>
          )
        }
        const tags = v.split(',').filter(Boolean)
        return (
          <Space size={4} wrap>
            {tags.map((t, i) => (
              <Tag key={i} color="green" bordered={false} style={{ margin: 0 }}>
                {t.trim()}
              </Tag>
            ))}
          </Space>
        )
      },
    },
    {
      title: '作者',
      dataIndex: 'authorNickname',
      width: 110,
      render: (v, r) => (r.isAnonymous ? '—' : v),
    },
    {
      title: '类型',
      dataIndex: 'postType',
      width: 80,
      render: (v) =>
        v === 1 ? <Tag color="gold" bordered={false}>塔罗</Tag> : <Tag color="green" bordered={false}>树洞</Tag>,
    },
    {
      title: '点赞',
      dataIndex: 'likeCount',
      width: 70,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v) => {
        const cfg = STATUS_CONFIG[v] ?? { label: '—', color: 'default' }
        return <Tag color={cfg.color} bordered={false}>{cfg.label}</Tag>
      },
    },
    {
      title: '操作',
      width: 340,
      render: (_, r) => (
        <Space size={4} wrap>
          <Button
            size="small"
            icon={<ThunderboltFilled />}
            loading={generatingId === r.id}
            onClick={() => generateSummary(r.id)}
            style={{ borderColor: '#7fb069', color: '#3d7a4d' }}
          >
            AI 摘要
          </Button>
          <Button
            size="small"
            icon={<CommentOutlined />}
            onClick={() => openComments(r.id)}
          >
            评论
          </Button>
          {r.status !== 1 && (
            <Button size="small" onClick={() => updateStatus(r.id, 1)}>
              隐藏
            </Button>
          )}
          {r.status !== 0 && (
            <Button size="small" type="primary" ghost onClick={() => updateStatus(r.id, 0)}>
              恢复
            </Button>
          )}
          {r.status !== 2 && (
            <Popconfirm title="确定删除？" okText="删除" cancelText="取消" onConfirm={() => updateStatus(r.id, 2)}>
              <Button size="small" danger>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} className="font-serif-cn" style={{ marginBottom: 4, color: '#1f3f2a' }}>
          帖子管理
        </Title>
        <Text style={{ color: '#6a7d70', fontSize: 13 }}>
          审核与维护广场上的每一则树洞；点「AI 摘要」可生成摘要与标签缓存到帖子
        </Text>
      </div>

      <Card
        style={{ borderRadius: 14, border: '1px solid #ece3d3' }}
        styles={{ body: { padding: 20 } }}
      >
        <Space style={{ marginBottom: 16 }} size={12} wrap>
          <Input.Search
            placeholder="搜索内容"
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
              { value: 1, label: '隐藏' },
              { value: 2, label: '删除' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={load}>
            刷新
          </Button>
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
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      {/* 评论管理 Modal */}
      <Modal
        title={`帖子 #${commentModalPostId ?? ''} 的评论（共 ${commentTotal} 条）`}
        open={commentModalPostId !== null}
        onCancel={() => setCommentModalPostId(null)}
        footer={null}
        width={720}
      >
        <Table
          rowKey="id"
          dataSource={comments}
          loading={commentLoading}
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: '内容',
              dataIndex: 'content',
              render: (v: string, r: CommentRow) => (
                <div>
                  {r.deleted ? (
                    <Text type="secondary" italic>
                      （已删除）
                    </Text>
                  ) : (
                    <Paragraph style={{ margin: 0, color: '#2a3530', fontSize: 13 }}>{v}</Paragraph>
                  )}
                  {r.replyToNickname && !r.deleted && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      @{r.replyToNickname}
                    </Text>
                  )}
                </div>
              ),
            },
            {
              title: '作者',
              dataIndex: 'authorNickname',
              width: 110,
              render: (v: string, r: CommentRow) => (r.isAnonymous ? '匿名' : v ?? '—'),
            },
            {
              title: '点赞',
              dataIndex: 'likeCount',
              width: 60,
              align: 'center' as const,
            },
            {
              title: '时间',
              dataIndex: 'createdAt',
              width: 150,
              render: (v: string) => new Date(v).toLocaleString('zh-CN'),
            },
            {
              title: '操作',
              width: 80,
              render: (_: any, r: CommentRow) =>
                r.deleted ? (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    已处理
                  </Text>
                ) : (
                  <Popconfirm
                    title="确定删除这条评论？"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={() => deleteComment(r.id)}
                  >
                    <Button type="link" size="small" danger loading={deletingCommentId === r.id}>
                      删除
                    </Button>
                  </Popconfirm>
                ),
            },
          ]}
        />
      </Modal>
    </div>
  )
}
