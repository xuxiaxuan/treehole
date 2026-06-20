import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  /** 速度向量 */
  vx: number
  vy: number
  /** 闪烁相位 */
  phase: number
  /** 闪烁速度 */
  twinkle: number
}

interface StarfieldBackgroundProps {
  /** 颜色变体：mystical 金白 / golden 暖金 */
  variant?: 'mystical' | 'golden'
  /** 星点数量（默认 60，性能与氛围平衡） */
  count?: number
}

/**
 * 粒子背景（canvas + requestAnimationFrame）
 * - 仅在 mystical / golden 暗色主题启用（由调用方控制挂载）
 * - 60fps 丝滑，组件卸载时清理 rAF 与 resize 监听
 */
export default function StarfieldBackground({
  variant = 'mystical',
  count = 60,
}: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const parent = canvas.parentElement
    let width = parent?.clientWidth ?? 0
    let height = parent?.clientHeight ?? 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const setupSize = () => {
      width = parent?.clientWidth ?? 0
      height = parent?.clientHeight ?? 0
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setupSize()

    // 初始化星点
    const stars: Star[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.005 + Math.random() * 0.015,
    }))

    // 颜色：mystical 偏金白，golden 偏暖金
    const palette =
      variant === 'golden'
        ? ['rgba(232, 200, 120, ', 'rgba(255, 235, 180, ', 'rgba(212, 165, 116, ']
        : ['rgba(244, 208, 63, ', 'rgba(255, 255, 255, ', 'rgba(200, 180, 255, ']

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      for (const s of stars) {
        s.x += s.vx
        s.y += s.vy
        s.phase += s.twinkle
        // 越界回绕
        if (s.x < -2) s.x = width + 2
        if (s.x > width + 2) s.x = -2
        if (s.y < -2) s.y = height + 2
        if (s.y > height + 2) s.y = -2

        const alpha = 0.35 + Math.sin(s.phase) * 0.35 + 0.3
        const colorIdx = Math.floor((s.r - 0.3) * 2) % palette.length
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `${palette[colorIdx]}${Math.max(0, Math.min(1, alpha))})`
        ctx.fill()
      }
      rafRef.current = requestAnimationFrame(render)
    }
    render()

    const handleResize = () => setupSize()
    window.addEventListener('resize', handleResize)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [variant, count])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
