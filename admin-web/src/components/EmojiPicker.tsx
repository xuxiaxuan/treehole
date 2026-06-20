import { Modal, Button } from 'antd'
import { useState, type ReactNode } from 'react'

/**
 * 森林系 24 枚 emoji 头像库（与 web 端保持一致）。
 */
const EMOJIS = [
  '🦊', '🦉', '🐿️', '🦔', '🐰', '🐻',
  '🦌', '🐢', '🌳', '🌲', '🌿', '🍃',
  '🍄', '🌱', '🌸', '🍁', '🌙', '⭐',
  '🌞', '🌧️', '❄️', '🔥', '💧', '🌈',
]

export interface EmojiPickerProps {
  /** 当前选中值：emoji 字符串或 undefined（表示使用昵称首字母） */
  value?: string
  onChange: (value: string | undefined) => void
  /** 自定义触发器 */
  children?: ReactNode
}

/**
 * emoji 头像选择器：基于 Ant Design Modal + 6 列 Button 网格。
 * 含「使用昵称首字母」清空选项。
 */
export function EmojiPicker({ value, onChange, children }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        style={{ cursor: 'pointer', display: 'inline-flex' }}
      >
        {children ?? <Button>选择头像</Button>}
      </span>
      <Modal
        title="选择森林头像"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={440}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 8,
          }}
        >
          {EMOJIS.map((e) => (
            <Button
              key={e}
              type={value === e ? 'primary' : 'default'}
              onClick={() => {
                onChange(e)
                setOpen(false)
              }}
              style={{ fontSize: 22, height: 48, padding: 0 }}
            >
              {e}
            </Button>
          ))}
        </div>
        <Button
          type="link"
          block
          onClick={() => {
            onChange(undefined)
            setOpen(false)
          }}
          style={{ marginTop: 12 }}
        >
          使用昵称首字母
        </Button>
      </Modal>
    </>
  )
}

export default EmojiPicker
