import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const nav = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login(form)
      setAuth(data.token, data.user)
      nav('/')
    } catch (err: any) {
      setError(err.message || '登录失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* 背景装饰光斑 */}
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-forest-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-clay-200/25 blur-3xl" />

      <div className="card-sheen relative w-full max-w-md animate-fade-in rounded-3xl border border-cream-200/70 bg-cream-50/90 p-8 shadow-float backdrop-blur-xl">
        {/* Logo 区 */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-gradient text-2xl shadow-soft">
            <span className="animate-float inline-block">🌳</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-forest-800">欢迎回来</h1>
          <p className="mt-1 text-sm text-sage-500">在这片森林里，你的心声一直都在</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {/* 错误提示（温暖版） */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-clay-200 bg-clay-50 px-3 py-2.5 text-sm text-clay-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full gap-2" size="lg">
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                登录中…
              </>
            ) : (
              '登录'
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-sage-500">
          还没有账号？
          <Link
            to="/register"
            className="ml-1 font-medium text-forest-600 underline-offset-4 transition-colors hover:text-forest-700 hover:underline"
          >
            种下一颗种子
          </Link>
        </p>
      </div>
    </div>
  )
}
