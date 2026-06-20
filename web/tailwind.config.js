/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 森林墨绿 - 主色（沉稳、治愈、安全感）
        forest: {
          50: '#f1f7f2',
          100: '#dceede',
          200: '#bbd8bf',
          300: '#8fbd98',
          400: '#5d9b6c',
          500: '#3d7a4d',
          600: '#2f633c',
          700: '#285233',
          800: '#1f3f2a',
          900: '#142a1c',
        },
        // 奶白暖中性 - 替代生硬的白/灰，带来温度
        cream: {
          50: '#fdfaf6',
          100: '#f7f1e8',
          200: '#ece3d3',
          300: '#d9ccb5',
          400: '#c2b196',
        },
        // 陶土橘 - 点缀色，温暖、活泼
        clay: {
          50: '#fdf3ee',
          100: '#fae0d3',
          200: '#f3bd9f',
          300: '#e89b6c',
          400: '#d97e4d',
          500: '#b8602e',
          600: '#964d22',
        },
        // 鼠尾草灰 - 辅助文字、次要信息
        sage: {
          50: '#f5f7f4',
          100: '#e8ece6',
          200: '#cdd6cb',
          300: '#a8b6a9',
          400: '#8a9b8e',
          500: '#6a7d70',
          600: '#4f5f54',
          700: '#3a463e',
        },
        // 语义别名（保持与原 shadcn/ui 组件兼容）
        primary: {
          DEFAULT: '#2f633c',
          foreground: '#fdfaf6',
        },
        ring: '#3d7a4d',
        // 塔罗 mystical 主题色板：深紫黑 + 金色星象
        mystical: {
          deep: '#0f0a2e',
          purple: '#1a1240',
          accent: '#3d2b7a',
          accent2: '#5b3b8c',
          gold: '#f4d03f',
        },
        // 塔罗 golden 主题色板：深酒红 + 金箔
        golden: {
          wine: '#3d1f1f',
          wine2: '#5a2828',
          gold: '#a8842f',
          gold2: '#e8c878',
          ruby: '#7a1f1f',
        },
        // 塔罗 minimal 主题色板：纯黑白
        minimal: {
          ink: '#000000',
          paper: '#ffffff',
          mist: '#f5f5f5',
          fog: '#e5e5e5',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(20, 42, 28, 0.06)',
        'float': '0 12px 32px -8px rgba(20, 42, 28, 0.14)',
        'inner-warm': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
      },
      backgroundImage: {
        'forest-gradient': 'linear-gradient(135deg, #3d7a4d 0%, #1f3f2a 100%)',
        'warm-gradient': 'linear-gradient(180deg, #fdfaf6 0%, #f7f1e8 100%)',
        'cream-radial':
          'radial-gradient(circle at 15% 10%, rgba(61, 122, 77, 0.05) 0%, transparent 45%), radial-gradient(circle at 85% 90%, rgba(217, 126, 77, 0.04) 0%, transparent 45%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        // 塔罗牌入场（抽牌瞬间）
        'tarot-flip-in': {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.9)' },
          '60%': { opacity: '1', transform: 'translateY(-4px) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // 星点缓慢漂浮（StarfieldBackground 中作为 CSS 备用）
        'star-drift': {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(6px, -8px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'float': 'float 3.5s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'tarot-flip-in': 'tarot-flip-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'star-drift': 'star-drift 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
