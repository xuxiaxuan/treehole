import { useEffect, useRef, useState } from 'react'
import { Card, Col, Row, Statistic, Typography, Tag, Empty, Spin } from 'antd'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { adminApi, type DashboardData } from '@/api/admin'

echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer])

const { Title, Text } = Typography

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data || !chartRef.current) return
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current)
    }
    const chart = chartInstanceRef.current
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['新帖', '新用户', '新评论', '新举报'], top: 0 },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: data.trend14d.dates, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: '新帖',
          type: 'line',
          smooth: true,
          data: data.trend14d.newPosts,
          itemStyle: { color: '#3d7a4d' },
          areaStyle: { opacity: 0.15 },
        },
        {
          name: '新用户',
          type: 'line',
          smooth: true,
          data: data.trend14d.newUsers,
          itemStyle: { color: '#1f3f2a' },
        },
        {
          name: '新评论',
          type: 'line',
          smooth: true,
          data: data.trend14d.newComments,
          itemStyle: { color: '#d4a373' },
        },
        {
          name: '新举报',
          type: 'line',
          smooth: true,
          data: data.trend14d.newReports,
          itemStyle: { color: '#c95c3e' },
        },
      ],
    })
    // 窗口 resize 时重绘
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [data])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin tip="加载中…" />
      </div>
    )
  }

  if (!data) {
    return <Empty description="数据加载失败" />
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} className="font-serif-cn" style={{ marginBottom: 4, color: '#1f3f2a' }}>
          数据看板
        </Title>
        <Text style={{ color: '#6a7d70', fontSize: 13 }}>
          社区核心指标 & 14 天趋势；每日 03:00 由 cron 备份（见 docs）
        </Text>
      </div>

      {/* 顶部指标卡 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={8} lg={4}>
          <Card style={{ borderRadius: 14, border: '1px solid #ece3d3' }}>
            <Statistic title="用户" value={data.totals.users} valueStyle={{ color: '#1f3f2a' }} />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card style={{ borderRadius: 14, border: '1px solid #ece3d3' }}>
            <Statistic title="帖子" value={data.totals.posts} valueStyle={{ color: '#3d7a4d' }} />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card style={{ borderRadius: 14, border: '1px solid #ece3d3' }}>
            <Statistic title="评论" value={data.totals.comments} valueStyle={{ color: '#5a7065' }} />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card style={{ borderRadius: 14, border: '1px solid #ece3d3' }}>
            <Statistic title="举报" value={data.totals.reports} valueStyle={{ color: '#c95c3e' }} />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card style={{ borderRadius: 14, border: '1px solid #ece3d3' }}>
            <Statistic title="收藏" value={data.totals.favorites} valueStyle={{ color: '#7fb069' }} />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card style={{ borderRadius: 14, border: '1px solid #ece3d3' }}>
            <Statistic title="关注" value={data.totals.follows} valueStyle={{ color: '#7fb069' }} />
          </Card>
        </Col>
      </Row>

      {/* 待办指标 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={<span style={{ color: '#1f3f2a' }}>待办事项</span>}
            style={{ borderRadius: 14, border: '1px solid #ece3d3' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Statistic
                  title={
                    <span>
                      待处理举报{' '}
                      {data.pending.pendingReports > 0 && (
                        <Tag color="error" bordered={false}>
                          需关注
                        </Tag>
                      )}
                    </span>
                  }
                  value={data.pending.pendingReports}
                  valueStyle={{ color: data.pending.pendingReports > 0 ? '#c95c3e' : '#3d7a4d' }}
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title={<span>已隐藏帖子</span>}
                  value={data.pending.hiddenPosts}
                  valueStyle={{ color: '#5a7065' }}
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title={
                    <span>
                      已封禁用户{' '}
                      {data.pending.bannedUsers > 0 && (
                        <Tag color="warning" bordered={false}>
                          审计
                        </Tag>
                      )}
                    </span>
                  }
                  value={data.pending.bannedUsers}
                  valueStyle={{ color: data.pending.bannedUsers > 0 ? '#d4a373' : '#3d7a4d' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 14 天趋势 */}
      <Card
        title={<span style={{ color: '#1f3f2a' }}>最近 14 天趋势</span>}
        style={{ marginTop: 16, borderRadius: 14, border: '1px solid #ece3d3' }}
        styles={{ body: { padding: 20 } }}
      >
        <div ref={chartRef} style={{ width: '100%', height: 360 }} />
      </Card>
    </div>
  )
}
