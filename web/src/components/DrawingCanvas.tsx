import { useEffect, useRef, useState } from 'react'
import { Brush, Eraser, Trash2, Undo2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 涂鸦 Canvas：支持鼠标 / 触摸；颜色 / 笔刷大小切换；撤销 / 清空 / 导出。
 * 导出：toDataURL('image/png') 返回 base64（约 50-200 KB，适合存 JSON）。
 */
export interface DrawingCanvasHandle {
  /** 导出当前画布为 base64 PNG（含 mime 前缀） */
  toDataURL: () => string | null
  /** 画布是否为空（用户没画过） */
  isEmpty: () => boolean
}

interface Props {
  width?: number
  height?: number
  className?: string
}

const COLORS = [
  '#1f3f2a', // forest
  '#3d7a4d', // sage
  '#c95c3e', // clay
  '#d4a373', // wheat
  '#7fb069', // leaf
  '#5a7065', // moss
  '#8b5a3c', // bark
  '#fdfaf6', // cream（亮色，在深色背景上用）
]

const BRUSH_SIZES = [3, 6, 12]

export default function DrawingCanvas({
  width = 480,
  height = 360,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const historyRef = useRef<ImageData[]>([])
  const [color, setColor] = useState(COLORS[0])
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1])
  const [isEraser, setIsEraser] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  // 初始化画布（白底）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fdfaf6'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctxRef.current = ctx
  }, [])

  const getPos = (e: React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const saveSnapshot = () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    // 限制历史 20 步（避免内存膨胀）
    if (historyRef.current.length > 20) historyRef.current.shift()
  }

  const startDraw = (e: React.PointerEvent) => {
    e.preventDefault()
    const ctx = ctxRef.current
    if (!ctx) return
    saveSnapshot()
    drawingRef.current = true
    lastPointRef.current = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
  }

  const draw = (e: React.PointerEvent) => {
    if (!drawingRef.current) return
    const ctx = ctxRef.current
    if (!ctx) return
    const pos = getPos(e)
    ctx.strokeStyle = isEraser ? '#fdfaf6' : color
    ctx.lineWidth = isEraser ? brushSize * 3 : brushSize
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPointRef.current = pos
    if (!hasDrawn) setHasDrawn(true)
  }

  const endDraw = () => {
    drawingRef.current = false
    lastPointRef.current = null
  }

  const undo = () => {
    const ctx = ctxRef.current
    if (!ctx || historyRef.current.length === 0) return
    const last = historyRef.current.pop()!
    ctx.putImageData(last, 0, 0)
  }

  const clear = () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    saveSnapshot()
    ctx.fillStyle = '#fdfaf6'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  // 暴露给父组件的方法（通过 ref）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // 通过自定义属性暴露（避免 forwardRef 的复杂度，KISS）
    ;(canvas as any)._drawingHandle = {
      toDataURL: () => (hasDrawn ? canvas.toDataURL('image/png') : null),
      isEmpty: () => !hasDrawn,
    }
  }, [hasDrawn])

  return (
    <div className={cn('space-y-3', className)}>
      {/* 画布 */}
      <div className="overflow-hidden rounded-2xl border-2 border-cream-200 bg-cream-50 shadow-soft">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          onPointerCancel={endDraw}
          className="block w-full cursor-crosshair touch-none"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      </div>

      {/* 工具栏 */}
      <div className="space-y-2 rounded-xl bg-cream-50/80 p-3">
        {/* 颜色 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-sage-500">颜色</span>
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c)
                  setIsEraser(false)
                }}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                  color === c && !isEraser
                    ? 'border-forest-600 scale-110 shadow-soft'
                    : 'border-cream-200'
                )}
                style={{ backgroundColor: c }}
                aria-label={`选择颜色 ${c}`}
              />
            ))}
          </div>
        </div>

        {/* 笔刷 + 工具 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-sage-500">笔刷</span>
          {BRUSH_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setBrushSize(s)
                setIsEraser(false)
              }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
                brushSize === s && !isEraser
                  ? 'border-forest-600 bg-forest-50'
                  : 'border-cream-200 hover:bg-cream-100'
              )}
              aria-label={`笔刷大小 ${s}`}
            >
              <span
                className="rounded-full bg-forest-700"
                style={{ width: s + 1, height: s + 1 }}
              />
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setIsEraser((v) => !v)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                isEraser
                  ? 'bg-clay-100 text-clay-600'
                  : 'text-sage-500 hover:bg-cream-100'
              )}
              aria-label="橡皮擦"
              title="橡皮擦"
            >
              <Eraser size={15} />
            </button>
            <button
              onClick={undo}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sage-500 transition-colors hover:bg-cream-100"
              aria-label="撤销"
              title="撤销"
            >
              <Undo2 size={15} />
            </button>
            <button
              onClick={clear}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-clay-500 transition-colors hover:bg-clay-50"
              aria-label="清空"
              title="清空"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 从 canvas DOM 节点读取 DrawingCanvasHandle（与组件内 setup 配对） */
export function getCanvasHandle(canvas: HTMLCanvasElement | null): DrawingCanvasHandle | null {
  if (!canvas) return null
  return (canvas as any)._drawingHandle ?? null
}
