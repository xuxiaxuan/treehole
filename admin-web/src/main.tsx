import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'antd/dist/reset.css'
import './index.css'
import App from './App'

// 治愈系森林主题 Token
const forestTheme = {
  token: {
    // 主色：森林墨绿
    colorPrimary: '#2f633c',
    colorPrimaryHover: '#285233',
    colorPrimaryActive: '#1f3f2a',

    // 信息/链接色统一到主色系
    colorInfo: '#2f633c',
    colorLink: '#3d7a4d',

    // 成功/警告/危险保持治愈系暖调
    colorSuccess: '#3d7a4d',
    colorWarning: '#d97e4d',
    colorError: '#b8602e',
    colorDanger: '#b8602e',

    // 文字与背景：奶白暖中性
    colorTextBase: '#2a3530',
    colorBgBase: '#fdfaf6',
    colorBgContainer: '#fffdf9',
    colorBgLayout: '#fdfaf6',
    colorBgElevated: '#fffdf9',

    // 边框：奶油色
    colorBorder: '#ece3d3',
    colorBorderSecondary: '#f3ecdb',

    // 圆角：温柔大圆角
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 8,

    // 字体
    fontFamily: "system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
    fontSize: 14,
    controlHeight: 38,
    controlHeightLG: 46,

    // 阴影
    boxShadow: '0 2px 12px -2px rgba(20, 42, 28, 0.06)',
    boxShadowSecondary: '0 12px 32px -8px rgba(20, 42, 28, 0.14)',
  },
  components: {
    Layout: {
      headerBg: '#fffdf9',
      siderBg: '#fffdf9',
      bodyBg: '#fdfaf6',
      headerHeight: 64,
      headerPadding: '0 24px',
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemColor: '#4f5f54',
      itemHoverBg: '#f1f7f2',
      itemHoverColor: '#2f633c',
      itemSelectedBg: '#dceede',
      itemSelectedColor: '#1f3f2a',
      itemBorderRadius: 10,
      itemMarginInline: 8,
    },
    Card: {
      colorBgContainer: '#fffdf9',
      borderRadiusLG: 14,
    },
    Table: {
      colorBgContainer: '#fffdf9',
      headerBg: '#f7f1e8',
      headerColor: '#285233',
      rowHoverBg: '#f1f7f2',
      borderColor: '#ece3d3',
      cellPaddingBlock: 14,
    },
    Button: {
      controlHeight: 36,
      controlHeightLG: 44,
      fontWeight: 500,
      primaryShadow: '0 2px 8px -2px rgba(47, 99, 60, 0.3)',
    },
    Input: {
      colorBgContainer: '#fffdf9',
      activeBorderColor: '#3d7a4d',
      hoverBorderColor: '#8fbd98',
      activeShadow: '0 0 0 3px rgba(61, 122, 77, 0.12)',
    },
    Select: {
      colorBgContainer: '#fffdf9',
      optionSelectedBg: '#dceede',
    },
    Tag: {
      borderRadiusSM: 6,
    },
  },
} as const

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={forestTheme as any}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
)
