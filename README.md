# 🌳 树洞广场 Treehole

![CI](https://github.com/xuxiaxuan/treehole/actions/workflows/ci.yml/badge.svg)
![Java](https://img.shields.io/badge/Java-17-orange.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> 一片可以安心说话的森林 · 匿名树洞 + 塔罗占卜 + AI 治愈

树洞广场是一个**治愈系匿名社区**，融合了传统树洞、塔罗占卜、AI 共鸣与私密日记。用户可以选择匿名或实名倾诉，让心事在森林里轻轻落地。

## ✨ 特色功能

### 🌳 核心社区
- **匿名/实名声洞**：每个心声都可以选择是否暴露身份
- **多类型帖子**：树洞、塔罗分享、涂鸦、Wordle 成绩单
- **温暖互动**：点赞、评论（2 级嵌套）、弹幕、收藏、关注、举报
- **AI 暖心回复**：每条帖子都可召唤 AI 写一句共情话

### 🔮 AI 治愈玩法
- **塔罗占卜**：AI 根据你的星座 + 问题抽 3 张牌并解读
- **每日运势**：基于生日的个性化 AI 运势
- **AI 内容审核**：发帖自动走 LLM 审核（fail-open + 举报兜底）

### 🌿 三大创新功能（产品差异化）

| 功能 | 本质 | 隐私 |
|---|---|---|
| **心情花园** 🌱 | 自己和自己的对话（私人日记 + 种植养成） | 完全私密 |
| **时间胶囊** ⏳ | 写给未来的自己（封印 N 天后显形广场） | 私密到公开 |
| **共鸣信号** 🌙 | 和相似陌生人的对话（每日聚类 + 匿名信件） | 完全匿名 |

**心情花园**：每条日记 = 一颗种子，每日自动生长，可选「移植到广场」分享给他人。

**时间胶囊**：写下此刻心声，封印 1 天 / 7 天 / 30 天 / 1 年，到时间自动出现在广场。

**共鸣信号**：每晚凌晨 03:00，AI 把过去 24h 的相似心声聚到一起；进入共鸣房间可以写匿名信，22:00 系统统一揭信，24h 后房间归档。

### 🎨 其他治愈小物
- **协作故事**：多人续写一个故事
- **心情热力图**：30 天 × 5 种心情的情绪分布
- **每日 Wordle**：治愈系猜词游戏
- **涂鸦画板**：自由创作并分享
- **每日话题**：30 天轮换的引导性话题

## 🛠️ 技术栈

| 层 | 选型 |
|---|---|
| **后端** | Spring Boot 3.2 · Spring Security · JWT · MyBatis-Plus · MySQL 8 · Bucket4j · Lombok |
| **AI** | Spring AI 1.0.0-M1 · Ollama（qwen2.5:3b 对话 + nomic-embed-text 向量） |
| **用户端** | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · Zustand |
| **管理端** | React 18 · Vite · TypeScript · Ant Design 5 · Zustand |
| **测试** | JUnit 5 · Spring Boot Test · H2 · Vitest |
| **部署** | Docker · Docker Compose · Caddy（HTTPS） · Cloudflare Pages |
| **监控** | Spring Actuator · Sentry（可选）|

## 🚀 快速开始

### 前置依赖
- JDK 17+
- Node.js 20+
- MySQL 8+（或用 docker-compose 起一个）
- Ollama（可选，启用 AI 功能需要）

### 后端启动
```bash
cd backend
./mvnw spring-boot:run
# 默认端口 8080；AI 功能需先 ollama pull qwen2.5:3b 和 nomic-embed-text
```

### 前端启动
```bash
# 用户端
cd web && npm install && npm run dev   # http://localhost:5173

# 管理端
cd admin-web && npm install && npm run dev   # http://localhost:5174
```

### 环境变量
参考 `.env.example`，关键变量：
```env
MYSQL_PASSWORD=xxx
JWT_SECRET=至少32字符的随机串
AI_ENABLED=true              # 启用 AI 功能（需 Ollama）
OLLAMA_BASE_URL=http://localhost:11434
SENTRY_DSN=                  # 可选，留空禁用错误监控
```

## 📁 项目结构

```
treehole/
├── backend/                    Java 后端（Spring Boot 单体）
│   ├── src/main/java/com/xxx/treehole/
│   │   ├── controller/         REST 控制器（按业务模块分包）
│   │   ├── service/            业务层 + ai/ 子包
│   │   ├── entity/             MyBatis-Plus 实体
│   │   ├── mapper/             数据访问
│   │   ├── dto/                请求/响应 DTO
│   │   ├── config/             Security/CORS/MyBatis/Bucket4j
│   │   └── common/             统一响应、异常、JWT、敏感词
│   └── src/main/resources/
│       ├── db/migration/       Flyway 迁移（V1~V14）
│       └── data/               塔罗牌组 + 每日话题静态资源
├── web/                        用户端（React + shadcn/ui）
├── admin-web/                  管理端（React + Ant Design）
├── docs/                       设计文档与实施计划
├── .github/workflows/ci.yml    GitHub Actions CI
├── docker-compose.yml          生产部署编排
└── Caddyfile                   HTTPS 反向代理
```

## 📊 核心数据模型

| 表 | 用途 |
|---|---|
| `users` | 用户（邮箱 + JWT + 角色） |
| `posts` | 帖子（含 mood 心情 + AI 摘要） |
| `comments` | 评论（2 级嵌套） |
| `likes` / `favorites` / `follows` | 用户关系 |
| `garden_notes` | 心情花园私人日记 |
| `time_capsules` | 时间胶囊（封印 → 显形） |
| `echo_clusters` + `echo_cluster_members` | 共鸣聚类 |
| `echo_letters` | 共鸣房间匿名信 |

完整 schema 见 [`backend/src/main/resources/schema.sql`](backend/src/main/resources/schema.sql)。

## 🧪 测试与 CI

- **后端**：60 个单元/集成测试（含 EchoService 聚类算法、JWT、敏感词、Auth/Post/Tarot/Admin Controller）
- **前端**：TypeScript 严格模式 + Vitest
- **CI**：每次 push / PR 自动跑 `mvn test` + 两个前端的 `tsc --noEmit` + `npm run build`

## 🚢 部署

完整部署指南见 [`docs/deployment.md`](docs/deployment.md)，简要：
- **前端**：Cloudflare Pages（两个子域，免费 CDN）
- **后端**：自购服务器 + Docker Compose（Caddy + Spring Boot + MySQL）
- **HTTPS**：Caddy 自动续签

## 🔒 隐私设计

- 匿名帖**不存储**作者 ID（前端按 isAnonymous 渲染）
- 共鸣信件**永不返回** `fromUserId`（VO 字段不存在）
- Sentry **不上报 PII**（邮箱/IP）
- 限流按 IP+URI 维度，防爆破

## 📜 License

MIT
