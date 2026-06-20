import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pickWordleOfDay, evaluateGuess, resultToEmoji, type LetterState } from '@/lib/wordleWords'
import { useAuthStore } from '@/store/auth'
import { postApi } from '@/api/post'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, Gamepad2, RefreshCw, Share2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_ATTEMPTS = 6
const WORD_LENGTH = 5

const STATE_COLOR: Record<LetterState, string> = {
  correct: 'bg-forest-500 text-cream-50 border-forest-600',
  present: 'bg-clay-400 text-cream-50 border-clay-500',
  absent: 'bg-sage-200 text-sage-700 border-sage-300',
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
]

type GameStatus = 'playing' | 'won' | 'lost'

interface History {
  guesses: string[]
  states: LetterState[][]
}

/** localStorage 当日记录（仅本地，不入库） */
function loadHistory(dateKey: string): History | null {
  try {
    const raw = localStorage.getItem(`wordle:${dateKey}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveHistory(dateKey: string, h: History) {
  localStorage.setItem(`wordle:${dateKey}`, JSON.stringify(h))
}

export default function Wordle() {
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)

  const today = useMemo(() => new Date(), [])
  const dateKey = useMemo(() => today.toISOString().slice(0, 10), [today])
  const answer = useMemo(() => pickWordleOfDay(today), [today])

  const [history, setHistory] = useState<History>(() => loadHistory(dateKey) ?? { guesses: [], states: [] })
  const [current, setCurrent] = useState('')
  const [shake, setShake] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [comment, setComment] = useState('')
  const [sharing, setSharing] = useState(false)

  const status: GameStatus = (() => {
    if (history.guesses.includes(answer)) return 'won'
    if (history.guesses.length >= MAX_ATTEMPTS) return 'lost'
    return 'playing'
  })()

  // 键盘字母累计状态（用于给键盘上色）
  const keyStates = useMemo(() => {
    const m: Record<string, LetterState> = {}
    for (const row of history.states) {
      for (let i = 0; i < row.length; i++) {
        const letter = history.guesses[history.states.indexOf(row)]?.[i]
        if (!letter) continue
        const before = m[letter]
        const now = row[i]
        // correct > present > absent（不降级）
        if (before === 'correct') continue
        if (now === 'correct') m[letter] = 'correct'
        else if (now === 'present' && before !== 'present') m[letter] = 'present'
        else if (!before) m[letter] = now
      }
    }
    return m
  }, [history])

  // 胜利/失败时自动弹分享框（延迟 800ms 让动画完成）
  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      const timer = setTimeout(() => {
        const emoji = history.states.map((s) => resultToEmoji(s)).join('\n')
        const header = `Treehole Wordle ${dateKey} · ${status === 'won' ? history.guesses.length : 'X'}/${MAX_ATTEMPTS}\n\n`
        setShareText(header + emoji)
        setShareOpen(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [status, history, dateKey])

  const submitGuess = () => {
    if (status !== 'playing') return
    if (current.length !== WORD_LENGTH) {
      triggerShake()
      return
    }
    const states = evaluateGuess(current, answer)
    const newHistory = {
      guesses: [...history.guesses, current],
      states: [...history.states, states],
    }
    setHistory(newHistory)
    saveHistory(dateKey, newHistory)
    setCurrent('')
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const onKey = (key: string) => {
    if (status !== 'playing') return
    if (key === 'ENTER') {
      submitGuess()
    } else if (key === 'BACK') {
      setCurrent((c) => c.slice(0, -1))
    } else if (/^[A-Z]$/.test(key) && current.length < WORD_LENGTH) {
      setCurrent((c) => c + key)
    }
  }

  // 物理键盘
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (shareOpen) return
      if (e.key === 'Enter') {
        onKey('ENTER')
      } else if (e.key === 'Backspace') {
        onKey('BACK')
      } else {
        const k = e.key.toUpperCase()
        if (/^[A-Z]$/.test(k)) onKey(k)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, status, shareOpen])

  const shareToSquare = async () => {
    if (!user) {
      nav('/login')
      return
    }
    setSharing(true)
    try {
      const content =
        comment.trim() ||
        `今天玩了 Treehole Wordle，${status === 'won' ? `${history.guesses.length}/${MAX_ATTEMPTS} 次猜中` : '没能猜出来'}！\n\n${history.states.map((s) => resultToEmoji(s)).join('\n')}`
      const tarotData = JSON.stringify({
        kind: 'wordle',
        date: dateKey,
        answer,
        attempts: history.guesses.length,
        won: status === 'won',
        emoji: history.states.map((s) => resultToEmoji(s)),
      })
      const res = await postApi.create({ content, isAnonymous, postType: 2, tarotData })
      nav(`/post/${res.id}`)
    } finally {
      setSharing(false)
    }
  }

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
    } catch {
      // 静默
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      {/* 标题 */}
      <header className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-forest-700">
          <Gamepad2 size={12} />
          每日一题 · {dateKey}
        </div>
        <h1 className="font-serif text-3xl font-bold text-forest-800">Wordle</h1>
        <p className="mt-2 text-sm text-sage-500">
          6 次机会猜出今日的 5 字母词；每日凌晨更新
        </p>
      </header>

      {/* 棋盘 */}
      <div className="mb-6 flex flex-col items-center gap-1.5">
        {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIdx) => {
          const isCurrent = rowIdx === history.guesses.length
          const guess = history.guesses[rowIdx] ?? (isCurrent ? current : '')
          const states = history.states[rowIdx] ?? new Array(WORD_LENGTH).fill(null)
          return (
            <div key={rowIdx} className={cn('flex gap-1.5', isCurrent && shake && 'animate-shake')}>
              {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => {
                const letter = guess[colIdx] ?? ''
                const st = states[colIdx]
                const revealed = !!st
                const filled = !!letter
                return (
                  <div
                    key={colIdx}
                    className={cn(
                      'flex h-14 w-14 items-center justify-center border-2 text-2xl font-bold uppercase transition-all duration-200',
                      revealed
                        ? cn(STATE_COLOR[st as LetterState], 'border-transparent')
                        : filled
                          ? 'border-sage-400 text-sage-700 bg-cream-50'
                          : 'border-cream-200 bg-cream-50/50 text-sage-400'
                    )}
                  >
                    {letter}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* 胜负状态条 */}
      {status !== 'playing' && (
        <div
          className={cn(
            'mb-4 rounded-xl border p-3 text-center',
            status === 'won'
              ? 'border-forest-200 bg-forest-50 text-forest-700'
              : 'border-clay-200 bg-clay-50 text-clay-700'
          )}
        >
          {status === 'won' ? (
            <p className="text-sm font-medium">
              🎉 {history.guesses.length} 次猜中！今天的词是 <b>{answer}</b>
            </p>
          ) : (
            <p className="text-sm font-medium">
              再接再厉，今天的词是 <b>{answer}</b>
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="mt-1 gap-1 text-xs"
          >
            <Share2 size={11} />
            分享到广场
          </Button>
        </div>
      )}

      {/* 虚拟键盘 */}
      <div className="space-y-1.5">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5">
            {row.map((key) => {
              const st = keyStates[key]
              const isSpecial = key === 'ENTER' || key === 'BACK'
              return (
                <button
                  key={key}
                  onClick={() => onKey(key)}
                  disabled={status !== 'playing'}
                  className={cn(
                    'flex h-11 min-w-[28px] items-center justify-center rounded-md px-2 text-xs font-bold uppercase transition-all',
                    'hover:scale-105 active:scale-95 disabled:opacity-40',
                    isSpecial && 'text-[10px]',
                    st
                      ? cn(STATE_COLOR[st], 'border-transparent')
                      : 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                  )}
                >
                  {key === 'BACK' ? '⌫' : key}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* 分享 Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-forest-800">
              <Sparkles size={16} className="text-clay-400" />
              分享到广场
            </DialogTitle>
            <DialogDescription className="text-sage-500">
              {status === 'won'
                ? `用了 ${history.guesses.length} 次猜中！让朋友们一起感受这份快乐`
                : '分享你的成绩，让朋友们也来挑战'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <pre className="rounded-xl bg-cream-100 p-3 text-xs whitespace-pre-wrap font-mono text-sage-700">
              {shareText}
            </pre>
            <Button onClick={copyShare} variant="outline" size="sm" className="w-full gap-1.5">
              <RefreshCw size={12} />
              复制结果
            </Button>

            {user && (
              <>
                <Textarea
                  placeholder="想对广场的朋友们说点什么？（可选）"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  maxLength={500}
                />
                <div className="flex items-center gap-2 rounded-xl bg-cream-100/60 px-3 py-2">
                  <Switch id="wordle-anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                  <Label htmlFor="wordle-anon" className="text-xs text-sage-500">
                    匿名分享
                  </Label>
                </div>
                <Button
                  onClick={shareToSquare}
                  disabled={sharing}
                  className="w-full gap-1.5"
                  size="lg"
                >
                  {sharing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      分享中…
                    </>
                  ) : (
                    <>
                      <Share2 size={14} />
                      发布到广场
                    </>
                  )}
                </Button>
              </>
            )}
            {!user && (
              <Button onClick={() => nav('/login')} variant="outline" className="w-full">
                登录后分享
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
