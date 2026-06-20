import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store/auth'
import client from '@/api/client'

const REASONS = ['辱骂/人身攻击', '广告/引流', '色情低俗', '违法犯罪', '其他']

export default function ReportDialog({
  open,
  onOpenChange,
  postId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  postId: number
}) {
  const user = useAuthStore((s) => s.user)
  const [reason, setReason] = useState(REASONS[0])
  const [detail, setDetail] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!user) {
      onOpenChange(false)
      return
    }
    setLoading(true)
    try {
      await client.post('/reports', {
        postId,
        reason: detail ? `${reason}：${detail}` : reason,
      })
      onOpenChange(false)
      setDetail('')
      alert('举报已提交，管理员会尽快处理')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>举报这条帖子</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2">
              <input type="radio" checked={reason === r} onChange={() => setReason(r)} />
              {r}
            </label>
          ))}
          <Textarea
            placeholder="补充说明（可选）"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submit} disabled={loading}>
            提交
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
