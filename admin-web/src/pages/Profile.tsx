import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, message, Typography, Space } from 'antd'
import { profileApi } from '@/api/profile'
import { Avatar } from '@/components/Avatar'
import { EmojiPicker } from '@/components/EmojiPicker'
import { useAuthStore } from '@/store/auth'

const { Title, Text } = Typography

/**
 * 管理员个人中心：头像/昵称维护 + 修改密码。
 * 改密成功后主动 logout 跳登录页。
 */
export default function Profile() {
  const nav = useNavigate()
  const { user, updateUser, logout } = useAuthStore()

  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatarUrl)
  const [detail, setDetail] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', confirm: '' })
  const [pwdSaving, setPwdSaving] = useState(false)

  useEffect(() => {
    profileApi
      .getDetail()
      .then((d: any) => {
        setDetail(d)
        setNickname(d.nickname)
        setAvatarUrl(d.avatarUrl)
        updateUser({
          nickname: d.nickname,
          avatarUrl: d.avatarUrl,
          status: d.status,
          createdAt: d.createdAt,
        })
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async () => {
    if (!nickname.trim()) {
      message.error('昵称不能为空')
      return
    }
    setSaving(true)
    try {
      const updated: any = await profileApi.update({
        nickname: nickname.trim(),
        avatarUrl,
      })
      updateUser({ nickname: updated.nickname, avatarUrl: updated.avatarUrl })
      message.success('已保存')
    } catch (e: any) {
      message.error(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const changePwd = async () => {
    if (pwd.newPassword !== pwd.confirm) {
      message.error('两次输入的新密码不一致')
      return
    }
    if (pwd.newPassword.length < 6 || pwd.newPassword.length > 32) {
      message.error('新密码长度需为 6-32 位')
      return
    }
    setPwdSaving(true)
    try {
      await profileApi.changePassword({
        oldPassword: pwd.oldPassword,
        newPassword: pwd.newPassword,
      })
      message.success('密码已修改，请重新登录')
      logout()
      nav('/login')
    } catch (e: any) {
      message.error(e.message || '修改失败')
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Title
          level={4}
          className="font-serif-cn"
          style={{ marginBottom: 4, color: '#1f3f2a' }}
        >
          管理员中心
        </Title>
        <Text style={{ color: '#6a7d70', fontSize: 13 }}>
          维护你的管理员资料与凭证
        </Text>
      </div>

      <Card
        style={{ borderRadius: 14, border: '1px solid #ece3d3', marginBottom: 16 }}
        styles={{ body: { padding: 24 } }}
      >
        <Space size={20} align="center" style={{ marginBottom: 20 }}>
          <Avatar avatarUrl={avatarUrl} nickname={nickname} size={72} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1f3f2a' }}>
              {nickname || '—'}
            </div>
            <div style={{ fontSize: 13, color: '#6a7d70' }}>{user?.email}</div>
            {detail && (
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  gap: 16,
                  fontSize: 12,
                  color: '#8a9b8e',
                }}
              >
                <span>发帖 {detail.postCount ?? 0}</span>
                <span>获赞 {detail.likeReceivedTotal ?? 0}</span>
                <span>
                  注册{' '}
                  {detail.createdAt
                    ? new Date(detail.createdAt).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            )}
          </div>
        </Space>

        <Form layout="vertical">
          <Form.Item label="昵称">
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={32}
              placeholder="给自己起个名字"
            />
          </Form.Item>
          <Form.Item label="头像">
            <Space>
              <Avatar avatarUrl={avatarUrl} nickname={nickname} size={40} />
              <EmojiPicker value={avatarUrl} onChange={setAvatarUrl}>
                <Button>更换头像</Button>
              </EmojiPicker>
              {avatarUrl && (
                <Button type="link" danger onClick={() => setAvatarUrl(undefined)}>
                  清空
                </Button>
              )}
            </Space>
          </Form.Item>
          <Button type="primary" loading={saving} onClick={save}>
            保存资料
          </Button>
        </Form>
      </Card>

      <Card
        title="修改密码"
        style={{ borderRadius: 14, border: '1px solid #ece3d3' }}
        styles={{ body: { padding: 24 } }}
      >
        <Form layout="vertical">
          <Form.Item label="原密码">
            <Input.Password
              value={pwd.oldPassword}
              onChange={(e) => setPwd({ ...pwd, oldPassword: e.target.value })}
              placeholder="••••••"
            />
          </Form.Item>
          <Form.Item label="新密码">
            <Input.Password
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
              placeholder="6-32 位"
            />
          </Form.Item>
          <Form.Item label="确认新密码">
            <Input.Password
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              placeholder="再次输入新密码"
            />
          </Form.Item>
          <Button loading={pwdSaving} onClick={changePwd}>
            修改密码
          </Button>
          <Text
            type="secondary"
            style={{ display: 'block', marginTop: 8, fontSize: 12 }}
          >
            修改成功后会自动退出，请使用新密码重新登录。
          </Text>
        </Form>
      </Card>
    </div>
  )
}
