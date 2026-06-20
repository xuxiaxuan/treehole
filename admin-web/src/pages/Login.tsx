import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, message, Typography } from 'antd'
import { LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons'
import client from '@/api/client'
import { useAuthStore } from '@/store/auth'

const { Title, Text } = Typography

export default function Login() {
  const nav = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)

  const submit = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      const data: any = await client.post('/auth/login', values)
      if (data.user.role !== 1) {
        message.error('该账号不是管理员')
        return
      }
      setAuth(data.token, data.user)
      nav('/posts')
    } catch (e: any) {
      message.error(e.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: 24,
      }}
    >
      {/* 背景装饰光斑 */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: -120,
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'rgba(189, 216, 191, 0.4)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'rgba(243, 189, 159, 0.35)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <Card
        className="card-sheen fade-in"
        style={{
          width: 420,
          borderRadius: 18,
          border: '1px solid #ece3d3',
          boxShadow: '0 12px 32px -8px rgba(20, 42, 28, 0.14)',
          background: 'rgba(255, 253, 249, 0.92)',
          backdropFilter: 'blur(16px)',
          position: 'relative',
          zIndex: 1,
        }}
        styles={{ body: { padding: 36 } }}
      >
        {/* Logo 区 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #3d7a4d 0%, #1f3f2a 100%)',
              color: '#fdfaf6',
              fontSize: 24,
              marginBottom: 12,
              boxShadow: '0 4px 12px -2px rgba(20, 42, 28, 0.25)',
            }}
          >
            <SafetyOutlined />
          </div>
          <Title
            level={3}
            className="font-serif-cn"
            style={{ marginBottom: 4, color: '#1f3f2a' }}
          >
            管理员登录
          </Title>
          <Text style={{ color: '#6a7d70', fontSize: 13 }}>
            守护树洞的秩序与温度
          </Text>
        </div>

        <Form
          onFinish={submit}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
          >
            <Input prefix={<MailOutlined style={{ color: '#8a9b8e' }} />} placeholder="管理员邮箱" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#8a9b8e' }} />}
              placeholder="密码"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block style={{ marginTop: 4 }}>
            进入管理台
          </Button>
        </Form>
      </Card>
    </div>
  )
}
