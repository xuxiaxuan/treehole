import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { profileApi } from '@/api/profile'
import { ffApi } from '@/api/favorite-follow'
import { useAuthStore, type User } from '@/store/auth'
import { Avatar } from '@/components/Avatar'
import { EmojiPicker } from '@/components/EmojiPicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Save, KeyRound, Sparkles, Heart, FileText, Bookmark, Users } from 'lucide-react'

/**
 * 个人中心页：信息展示 + 编辑资料 + 修改密码。
 * 改密成功后主动 logout 跳登录页（无状态 JWT 本期不做失效）。
 */
export default function Profile() {
  const nav = useNavigate()
  const { user, updateUser, logout } = useAuthStore()

  const [profile, setProfile] = useState<User | null>(user)
  const [loading, setLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatarUrl)
  const [birthday, setBirthday] = useState<string>(user?.birthday ?? '')

  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', confirm: '' })
  // 生日 max = 今天（@PastOrPresent 允许今天，禁未来）
  const yesterdayStr = new Date().toISOString().slice(0, 10)

  // 关注/粉丝计数
  const [followStats, setFollowStats] = useState<{ followerCount: number; followingCount: number }>({
    followerCount: 0,
    followingCount: 0,
  })
  useEffect(() => {
    if (user?.id) {
      ffApi.followInfo(user.id).then((i) =>
        setFollowStats({ followerCount: i.followerCount, followingCount: i.followingCount })
      ).catch(() => {})
    }
  }, [user?.id])

  const loadDetail = async () => {
    try {
      const detail = await profileApi.getDetail()
      setProfile(detail)
      setNickname(detail.nickname)
      setAvatarUrl(detail.avatarUrl)
      setBirthday(detail.birthday ?? '')
      updateUser({
        nickname: detail.nickname,
        avatarUrl: detail.avatarUrl,
        birthday: detail.birthday,
        status: detail.status,
        createdAt: detail.createdAt,
      })
    } catch (e) {
      // 静默：页面顶部已有错误提示入口
    }
  }

  useEffect(() => {
    void loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveProfile = async () => {
    setError('')
    setSuccess('')
    if (!nickname.trim()) {
      setError('昵称不能为空')
      return
    }
    setLoading(true)
    try {
      const updated = await profileApi.update({
        nickname: nickname.trim(),
        avatarUrl,
        birthday: birthday || null,
      })
      updateUser({
        nickname: updated.nickname,
        avatarUrl: updated.avatarUrl,
        birthday: updated.birthday,
      })
      setProfile({ ...profile, ...updated })
      setSuccess('资料已保存 🌿')
    } catch (e: any) {
      setError(e.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const changePwd = async () => {
    setError('')
    setSuccess('')
    if (pwd.newPassword !== pwd.confirm) {
      setError('两次输入的新密码不一致')
      return
    }
    if (pwd.newPassword.length < 6 || pwd.newPassword.length > 32) {
      setError('新密码长度需为 6-32 位')
      return
    }
    setPwdLoading(true)
    try {
      await profileApi.changePassword({
        oldPassword: pwd.oldPassword,
        newPassword: pwd.newPassword,
      })
      // 改密成功：主动 logout 模拟"重登"
      logout()
      nav('/login')
    } catch (e: any) {
      setError(e.message || '修改密码失败')
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-forest-800">个人中心</h1>
        <p className="mt-1 text-sm text-sage-500">在这里照看你的小树洞 🌳</p>
      </header>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-clay-200 bg-clay-50 px-3 py-2.5 text-sm text-clay-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-forest-200 bg-forest-50 px-3 py-2.5 text-sm text-forest-700">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* 左列：形象展示 + 统计 */}
        <Card className="md:row-span-2">
          <CardHeader>
            <CardTitle>我的形象</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5">
            <Avatar avatarUrl={avatarUrl} nickname={nickname} size="xl" />
            <EmojiPicker value={avatarUrl} onChange={setAvatarUrl}>
              <button
                type="button"
                className="rounded-full bg-forest-50 px-3 py-1.5 text-xs text-forest-700 transition-colors hover:bg-forest-100"
              >
                选择森林头像
              </button>
            </EmojiPicker>
            <div className="w-full rounded-2xl bg-cream-100/60 p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat
                  icon={<FileText size={14} />}
                  value={profile?.postCount ?? 0}
                  label="发帖"
                />
                <Stat
                  icon={<Heart size={14} />}
                  value={profile?.likeReceivedTotal ?? 0}
                  label="获赞"
                />
                <Stat
                  icon={<Users size={14} />}
                  value={followStats.followerCount}
                  label="粉丝"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/me/favorites"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-cream-50 px-3 py-2 text-xs font-medium text-sage-600 transition-colors hover:bg-cream-100"
                >
                  <Bookmark size={12} />
                  我的收藏
                </Link>
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-cream-50 px-3 py-2 text-xs font-medium text-sage-600">
                  <Users size={12} />
                  关注 {followStats.followingCount}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 右上：编辑资料 */}
        <Card>
          <CardHeader>
            <CardTitle>编辑资料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={32}
                placeholder="给自己起个温暖的名字"
              />
            </div>
            <div className="space-y-2">
              <Label>头像</Label>
              <div className="flex items-center gap-3">
                <Avatar avatarUrl={avatarUrl} nickname={nickname} size="lg" />
                <EmojiPicker value={avatarUrl} onChange={setAvatarUrl}>
                  <Button type="button" variant="outline" size="sm">
                    更换头像
                  </Button>
                </EmojiPicker>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvatarUrl(undefined)}
                  >
                    清空
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">
                生日
                <span className="ml-2 text-xs font-normal text-sage-400">
                  （用于 AI 塔罗星座推算）
                </span>
              </Label>
              <Input
                id="birthday"
                type="date"
                max={yesterdayStr}
                value={birthday ?? ''}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
            <Button onClick={saveProfile} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              保存
            </Button>
          </CardContent>
        </Card>

        {/* 右下：修改密码 */}
        <Card>
          <CardHeader>
            <CardTitle>修改密码</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old">原密码</Label>
              <Input
                id="old"
                type="password"
                value={pwd.oldPassword}
                onChange={(e) => setPwd({ ...pwd, oldPassword: e.target.value })}
                placeholder="••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">新密码</Label>
              <Input
                id="new"
                type="password"
                value={pwd.newPassword}
                onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                placeholder="6-32 位"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">确认新密码</Label>
              <Input
                id="confirm"
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                placeholder="再次输入新密码"
              />
            </div>
            <Button onClick={changePwd} disabled={pwdLoading} variant="outline" className="gap-1.5">
              {pwdLoading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
              修改密码
            </Button>
            <p className="text-xs text-sage-400">
              修改成功后会自动退出，请使用新密码重新登录。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sage-400">{icon}</span>
      <span className="font-serif text-xl font-bold text-forest-700">{value}</span>
      <span className="text-xs text-sage-500">{label}</span>
    </div>
  )
}
