# 树洞广场 (Treehole) — v1.0 设计文档

**文档版本**：v1.0
**创建日期**：2026-06-18
**作者**：用户与 Claude Code 协同设计
**状态**：待用户复核

---

## 1. 项目概述

**一句话**：「匿名树洞 + 塔罗占卜广场」的轻量级社区产品。

用户可以：
- 以**可选匿名**方式发表「树洞帖」（心声、吐槽、秘密）
- 在**广场**浏览所有人的帖子，点赞互动
- 使用**塔罗占卜**功能抽 3 张牌并获得解读，可一键分享到广场
- 管理员通过**独立后台**管理内容、处理举报、封禁违规用户

---

## 2. 背景与动机

- 用户希望做一个**功能较多、较有创意**的网站（不是单纯个人博客或作品集）。
- 「树洞 + 广场」提供 UGC 互动闭环；「塔罗占卜」是与树洞气质契合的差异化玩法。
- 全程 **vibecoding** 实施（AI 写代码、人审人改），技术栈必须 AI 友好。

---

## 3. 用户画像

| 角色 | 描述 |
|---|---|
| 普通用户 | 注册/登录后可发帖（可选匿名）、点赞、塔罗占卜、举报 |
| 匿名访客 | 可浏览广场列表与详情，但不能发帖/点赞 |
| 管理员 | 通过独立子域访问后台，管理帖子/用户/举报 |

---

## 4. v1.0 核心功能（MVP）

### 4.1 必做（In Scope）

| 模块 | 功能 |
|---|---|
| 认证 | 邮箱注册、登录、JWT 鉴权 |
| 树洞 | 发帖（**可选匿名 toggle**）、广场列表（分页）、帖子详情、点赞（toggle 语义） |
| 塔罗 | 抽 3 张牌（含正逆位）、静态文案解读、一键分享到广场 |
| 管理 | 独立后台：帖子管理（删/隐藏/恢复）、举报队列、用户管理（封禁/解禁） |
| 安全 | 敏感词过滤、举报按钮、Bucket4j 限流、JWT、HTTPS |
| 审核 | **先发后审**（用户帖子立即可见，管理员事后处理） |

### 4.2 非目标（Out of Scope，留给 v2+）

- 评论 / 回复 / 收藏
- 关注 / 个人主页 / Now Page
- 塔罗 AI 解读（接 LLM）
- 内容预审流（先审后发）
- 数据看板、操作日志审计、多角色权限
- 实时弹幕、在线人数、协作故事、心情地图、涂鸦板、Wordle
- 移动端 PWA / 原生 App

---

## 5. 技术栈

### 5.1 总览

| 层 | 选型 | 理由 |
|---|---|---|
| **前端（用户端）** | React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Zustand + axios | 产品风 UI，AI 训练数据充足 |
| **前端（管理端）** | React 18 + Vite + TypeScript + **Ant Design** + Zustand + axios | 工具风 UI，管理后台事实标准 |
| **后端** | Spring Boot 3.x + Spring Security + JWT + MyBatis-Plus + Maven | Java 圈主流，AI 最熟 |
| **数据库** | MySQL 8.x | 国内主流，MyBatis-Plus 配合最佳 |
| **限流** | Bucket4j（纯 Java，无外部依赖） | v1 不需要 Redis |
| **塔罗数据** | 静态 JSON 文件 + Rider-Waite 公版牌面图片 | 静态内容不入库 |
| **部署（前端）** | Cloudflare Pages（两个子域） | 免费 + CDN |
| **部署（后端）** | 用户自购服务器 + Docker Compose | 简单可控 |
| **HTTPS** | Caddy 自动续签 | 比 Nginx + Certbot 简单 |

### 5.2 不使用 Redis 的理由

- v1 流量预期小（日活几十到几百），MySQL 单机足够
- 限流用 Bucket4j（纯 Java 库）即可
- 加 Redis 多一份运维负担，YAGNI
- 未来真有性能瓶颈再加 Redis 不影响架构

---

## 6. 系统架构

### 6.1 仓库结构（Monorepo）

```
treehole/                          ← 单一 Git 仓库
├── web/                           ← 用户端前端
├── admin-web/                     ← 管理端前端（独立子项目）
├── backend/                       ← Java 后端
├── docs/                          ← 文档（含本 spec）
├── docker-compose.yml             ← 后端部署编排
├── .env.example                   ← 环境变量模板
└── README.md
```

### 6.2 部署拓扑

```
┌─────────────────────────────────────────┐
│ Cloudflare Pages（免费）                  │
│  ├── web      → yourdomain.com          │
│  └── admin-web → admin.yourdomain.com   │
│                  + Cloudflare IP 白名单   │
└─────────────────────────────────────────┘
                  ↓ HTTPS API
┌─────────────────────────────────────────┐
│ 用户服务器（Docker Compose）             │
│  ├── caddy      (443 → 8080 反代+证书)   │
│  ├── spring-boot(8080)                  │
│  └── mysql      (3306，仅内网)           │
└─────────────────────────────────────────┘
```

### 6.3 后端模块划分

```
backend/src/main/java/com/xxx/treehole/
├── controller/
│   ├── AuthController         （注册/登录/me）
│   ├── PostController         （发帖/列表/详情/点赞）
│   ├── TarotController        （deck）
│   ├── ReportController       （举报）
│   └── admin/
│       ├── AdminPostController
│       ├── AdminReportController
│       └── AdminUserController
├── service/                   ← 业务逻辑
├── mapper/                    ← MyBatis-Plus 数据访问
├── entity/                    ← 数据库实体
├── dto/                       ← 请求/响应 DTO
├── config/                    ← Security / CORS / MyBatis / Bucket4j
└── common/                    ← 统一响应、全局异常、JWT 工具、敏感词工具
```

### 6.4 前端模块划分（用户端 `web/`）

```
web/src/
├── pages/
│   ├── Home.tsx              ← 广场列表（默认首页）
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── NewPost.tsx           ← 发树洞帖（含匿名 toggle）
│   ├── PostDetail.tsx        ← 帖子详情 + 点赞
│   └── Tarot.tsx             ← 塔罗占卜页
├── components/               ← shadcn/ui 二次封装
├── api/                      ← axios 客户端
├── store/                    ← Zustand（用户态、Token）
└── lib/                      ← 工具函数（含 tarotDeck.ts 抽牌算法）
```

### 6.5 前端模块划分（管理端 `admin-web/`）

```
admin-web/src/
├── pages/
│   ├── Login.tsx
│   ├── Posts.tsx             ← 帖子管理（列表/搜索/删除/隐藏/恢复）
│   ├── Reports.tsx           ← 举报队列
│   └── Users.tsx             ← 用户管理（封禁/解禁/提升管理员）
├── components/
├── api/
└── store/
```

### 6.6 设计原则（vibecoding 友好）

- **每个 controller 单一职责**：Auth 只管登录注册，Post 只管帖子
- **目录扁平化**：不超过 3 层嵌套
- **DTO 与 Entity 分离**：API 字段与数据库字段解耦
- **统一响应格式**：所有 API 返回 `{ code, msg, data }`

---

## 7. 数据模型

### 7.1 表结构

```sql
-- 用户表
users
├── id            BIGINT PK AUTO_INCREMENT
├── email         VARCHAR(128) UNIQUE NOT NULL
├── password_hash VARCHAR(128) NOT NULL       -- BCrypt 加密
├── nickname      VARCHAR(32)
├── avatar_url    VARCHAR(256)
├── role          TINYINT DEFAULT 0            -- 0=普通用户 1=管理员
├── status        TINYINT DEFAULT 0            -- 0=正常 1=封禁
├── created_at    DATETIME
└── updated_at    DATETIME

-- 帖子表（核心）
posts
├── id            BIGINT PK AUTO_INCREMENT
├── user_id       BIGINT NOT NULL              -- ⚠️ 即使匿名也存真实 ID（合规）
├── is_anonymous  TINYINT DEFAULT 0            -- 0=实名 1=匿名
├── content       TEXT NOT NULL
├── post_type     TINYINT DEFAULT 0            -- 0=树洞 1=塔罗分享
├── tarot_data    JSON                          -- 塔罗帖才填：{cards, spread, reading}
├── like_count    INT DEFAULT 0                 -- 冗余字段，避免列表 count
├── status        TINYINT DEFAULT 0            -- 0=正常 1=隐藏 2=删除
├── created_at    DATETIME
└── updated_at    DATETIME
INDEX (status, created_at DESC)                 -- 广场列表主查询

-- 点赞表
likes
├── id            BIGINT PK AUTO_INCREMENT
├── user_id       BIGINT NOT NULL
├── post_id       BIGINT NOT NULL
├── created_at    DATETIME
UNIQUE KEY uk_user_post (user_id, post_id)      -- 防重复点赞

-- 举报表
reports
├── id            BIGINT PK AUTO_INCREMENT
├── reporter_id   BIGINT NOT NULL
├── post_id       BIGINT NOT NULL
├── reason        VARCHAR(256)
├── status        TINYINT DEFAULT 0             -- 0=待处理 1=已处理
└── created_at    DATETIME
```

### 7.2 关键设计决策

| 决策 | 理由 |
|---|---|
| **匿名帖也存真实 user_id** | 合规需要——违法内容管理员必须能溯源。API 永不返回该字段 |
| **塔罗牌数据不入库** | 78 张牌静态，放 `resources/data/tarot.json`（KISS） |
| **tarot_data 用 JSON 字段** | MySQL 8.x 原生支持，分享时一次存牌+解读 |
| **冗余 like_count** | 列表展示点赞数避免 N+1 查询 |
| **软删除（status 字段）** | 方便审核回溯、防误操作 |

### 7.3 匿名逻辑

```
发帖请求 → 后端校验 JWT 拿到 user_id
              ↓
        INSERT posts (user_id=真实ID, is_anonymous=用户选择)
              ↓
        查询广场时：
          - is_anonymous=0 → JOIN users 返回 nickname + avatar
          - is_anonymous=1 → 不 JOIN，硬编码返回 {nickname:"匿名用户", avatar:默认图}
```

**安全保证**：匿名帖的 API 响应**永不包含 user_id 字段**，前端拿不到，连抓包也看不到。只有数据库管理员能查。

### 7.4 塔罗数据文件 (`backend/src/main/resources/data/tarot.json`)

```json
{
  "major": [
    {
      "id": 0,
      "name": "愚者",
      "name_en": "The Fool",
      "keywords": ["新开始", "自由", "冒险"],
      "upright": "...正位解读...",
      "reversed": "...逆位解读...",
      "image": "/tarot/major/00.jpg"
    }
    /* 22 张大阿尔卡那 */
  ],
  "minor": [
    /* 56 张小阿尔卡那 */
  ]
}
```

牌面图片放 `backend/src/main/resources/static/tarot/`，前端通过后端静态接口访问。

---

## 8. API 设计

### 8.1 统一响应格式

```json
{ "code": 200, "msg": "success", "data": { /* ... */ } }
```

| code | 含义 |
|---|---|
| 200 | 成功 |
| 400 | 参数错 / 敏感词命中 / 业务异常 |
| 401 | 未登录 / Token 过期 |
| 403 | 已登录但无权限（如非管理员） |
| 500 | 服务器异常（不暴露堆栈） |

### 8.2 接口清单

```
认证
POST /api/auth/register   {email, password, nickname}     → {token, user}
POST /api/auth/login      {email, password}               → {token, user}
GET  /api/auth/me         (JWT)                           → {user}

帖子
GET  /api/posts           ?page=1&size=20&type=all        → {list, total}
GET  /api/posts/{id}                                      → {post}
POST /api/posts           {content, isAnonymous, type, tarotData?}  → {id}
POST /api/posts/{id}/like (JWT, toggle)                   → {liked, likeCount}

塔罗
GET  /api/tarot/deck                                      → 78 张牌数据

举报
POST /api/reports         (JWT) {postId, reason}          → {id}

管理端（需 role=1）
GET    /api/admin/posts          ?status=&keyword=&page=
PATCH  /api/admin/posts/{id}/status   {status: 0|1|2}
GET    /api/admin/reports        ?status=&page=
PATCH  /api/admin/reports/{id}   {action: "dismiss"|"delete_post"}
GET    /api/admin/users          ?status=&keyword=&page=
PATCH  /api/admin/users/{id}/status   {status: 0|1}
PATCH  /api/admin/users/{id}/role     {role: 0|1}
```

---

## 9. 关键流程

### 9.1 注册/登录

```
表单校验 → POST → BCrypt 加密密码 → INSERT users → 签发 JWT（含 userId, role）
       → 前端存 localStorage → axios 拦截器自动带 Authorization: Bearer xxx
```

### 9.2 发树洞帖

```
填内容 + 切「匿名」toggle → POST → JWT 鉴权 → 敏感词检查（hutool）
   → 命中则返回 400 + 命中词列表
   → 通过则 INSERT posts → 返回 postId → 跳广场
```

### 9.3 塔罗占卜 + 分享（核心亮点）

```
访问 /tarot
   ↓
GET /api/tarot/deck（拉 78 张牌元数据）
   ↓
用户点「开始抽牌」→ 前端翻牌动画 + Math.random 抽 3 张（含正逆位）
   ↓
前端从 tarot.json 拼 3 张牌的 upright/reversed 解读
   ↓
展示结果页（牌面 + 牌义 + 综合解读）
   ↓
用户点「分享到广场」
   ↓
POST /api/posts {
  content: "我的塔罗占卜...",
  isAnonymous: 用户选,
  type: 1,
  tarotData: {cards: [...], spread: "three-card", reading: "..."}
}
   ↓
帖子出现在广场，带 [塔罗] 标签，详情页能还原展示抽到的牌
```

### 9.4 广场列表

```
GET /api/posts → MyBatis-Plus 分页（status=0 + created_at DESC）
   → 遍历：
     - 匿名帖硬编码 {nickname:"匿名用户", avatar:默认图}
     - 实名帖 JOIN users 取 nickname + avatar
   → 返回
```

### 9.5 点赞（toggle 语义）

```
点击爱心 → POST /api/posts/{id}/like
   → 事务内：
     - INSERT likes (user_id, post_id)（唯一键防重）
     - UPDATE posts SET like_count = like_count + 1
   - 若已点过（捕获唯一键冲突）：
     - DELETE likes + UPDATE like_count - 1
   → 返回 {liked: true/false, likeCount: N}
```

### 9.6 举报

```
弹窗选理由（违规/广告/辱骂/其他）→ POST /api/reports
   → INSERT reports(status=0)
   → 管理员在 admin-web 处理：标记已处理 + 可选删帖
```

---

## 10. 错误处理

- `@RestControllerAdvice` 全局异常处理器兜底
- 业务异常 `BusinessException`（敏感词、重复点赞等）→ code=400 + 友好消息
- 参数校验异常 `MethodArgumentNotValidException` → code=400 + 字段错误信息
- 未知异常 → code=500 + 「服务繁忙，请稍后再试」（不暴露堆栈）
- 前端 axios 拦截器统一弹 toast，401 自动跳登录页

---

## 11. 安全设计

| 项 | 措施 |
|---|---|
| 密码存储 | BCrypt（cost=10），绝不存明文 |
| 接口鉴权 | JWT（7 天有效期），除 `/auth/*` 和 `GET /posts` 都校验 |
| SQL 注入 | MyBatis-Plus 全部参数化，禁用字符串拼接 SQL |
| XSS | 前端 React 默认转义 + 后端入库前 strip 危险标签 |
| 限流 | Bucket4j：单 IP 每分钟发帖 ≤ 5 次 |
| CORS | 后端允许 `https://yourdomain.com`，开发环境允许 `localhost` |
| 管理端保护 | 独立子域 + Cloudflare IP 白名单 + JWT + role=1 校验 |
| 内容合规 | 敏感词过滤 + 举报 + 真实 user_id 留存 |

---

## 12. 测试策略

### 12.1 为什么 vibecoding 必须有测试

- AI 改代码容易引入回归
- 没测试 = 没护栏 = 改一处坏一片
- 有测试 = AI 能自己跑测试验证

### 12.2 v1 测试范围

**后端测试**（Spring Boot Test + JUnit 5，H2 内存库）：

```
✅ AuthControllerTest     — 注册、登录、Token 验证
✅ PostControllerTest     — 发帖、匿名逻辑、点赞 toggle
✅ TarotControllerTest    — deck 返回 78 张牌
✅ SensitiveWordUtilTest  — 敏感词命中
✅ JwtUtilTest            — 生成/解析/过期
✅ AdminControllerTest    — 管理员权限校验
```

**前端测试**（Vitest）：

```
✅ tarotDeck.test.ts      — 塔罗抽牌算法（纯函数必须有单测）
⏭️ 其他 UI 测试 v1 推迟
```

**原则**：每个 API 至少 1 个 happy path + 1 个 error path。

---

## 13. 部署方案

### 13.1 前端（两个静态站）

```
Cloudflare Pages（免费）
- web       → yourdomain.com
- admin-web → admin.yourdomain.com（+ IP 白名单）
```

### 13.2 后端（Docker Compose）

```yaml
# docker-compose.yml
services:
  caddy:        # 443 → 8080 反代 + 自动 HTTPS
  app:          # Spring Boot :8080
  mysql:        # :3306，仅内网
```

部署流程：`SSH → git pull → docker compose up -d --build`。

### 13.3 环境变量

- `.env` 文件 + `docker-compose.yml` 引用
- 敏感信息（DB 密码、JWT secret）不入 Git
- `.env.example` 入 Git 供 vibecoding 参考

### 13.4 MySQL 备份

```bash
# crontab，每天 03:00 备份，保留 7 天
0 3 * * * mysqldump -u root -p${DB_PASSWORD} treehole | gzip > /backup/$(date +\%Y\%m\%d).sql.gz && find /backup -mtime +7 -delete
```

### 13.5 监控

- 日志：logback 写文件，`docker logs` 查看
- 错误告警：Sentry 免费版（5K errors/月够用）
- 不上 Prometheus/Grafana（YAGNI）

---

## 14. 风险与对策

| 风险 | 影响 | 对策 |
|---|---|---|
| 敏感内容合规 | ⚠️ 法律风险 | 敏感词 + 举报 + 真实 user_id 留存（已设计） |
| vibecoding 引入回归 | 🔧 代码质量 | 6 个后端测试 + 1 个前端测试 + 小步 Git 提交 |
| 服务器被刷 | 💸 成本 | Bucket4j 限流 + Cloudflare CDN |
| 管理端被入侵 | 🔥 数据泄露 | 独立子域 + IP 白名单 + JWT + HTTPS |
| MySQL 数据丢失 | 💀 不可恢复 | 每日 mysqldump + 7 天滚动 |
| 上线后没流量 | 😅 尴尬 | v1 先做最小集，跑通流程再扩功能 |
| vibecoding 上下文丢失 | 🤖 AI 改坏 | 每个 task 独立 spec + git commit |

---

## 15. 里程碑

### 推荐迭代节奏（vibecoding 实际节奏）

```
Week 1：后端骨架
  ├─ 项目初始化（Spring Boot + MyBatis-Plus + MySQL）
  ├─ 用户系统（注册/登录/JWT）
  ├─ 帖子 CRUD + 匿名逻辑
  ├─ 塔罗 deck 接口 + 静态 JSON 数据
  ├─ 管理端 API
  └─ 6 个后端测试

Week 2：用户端前端
  ├─ Vite + React + shadcn/ui 脚手架
  ├─ 注册/登录/广场列表
  ├─ 发帖页（含匿名 toggle）
  ├─ 帖子详情 + 点赞
  ├─ 塔罗占卜页（抽牌动画 + 静态解读 + 分享到广场）
  └─ 塔罗抽牌算法单测

Week 3：管理端 + 联调 + 部署
  ├─ admin-web（Ant Design）4 个页面
  ├─ Cloudflare Pages 部署两个前端
  ├─ 服务器 Docker Compose 部署后端
  ├─ 第一个管理员账号配置（SQL 升级 role=1）
  └─ 端到端联调

Week 4：缓冲
  ├─ Bug 修复
  ├─ 内测（找几个朋友试用）
  └─ 收集反馈，规划 v2
```

---

## 16. v2+ 路线图（不实现，只规划）

```
v2.0：社区化
  ├─ 评论 / 回复 / 收藏
  ├─ 关注 / 个人主页
  └─ 每日话题墙

v2.5：内容深化
  ├─ 塔罗 AI 解读（Python + LLM）
  ├─ 数据看板（管理员）
  └─ 内容预审流

v3.0：玩法扩展
  ├─ 协作写故事 / 心情地图 / 涂鸦板 / Wordle
  ├─ 实时弹幕 / 在线人数
  └─ 移动端 PWA
```

---

## 17. vibecoding 工作流（实施阶段）

```
1. 调用 writing-plans skill → 把本 spec 拆成 N 个可独立交付的 task
2. 每个 task 让 Claude Code 实现
3. 跑测试通过
4. Git commit（小步提交）
5. 全部完成后 docker compose 部署
```

**关键纪律**：
- 一个 task 完成并测试通过后再开始下一个
- 每个 task 一个独立 commit
- 遇到设计偏离，回到本 spec 修订，不擅自扩展范围

---

## 18. 待办与未决问题

| 项 | 说明 | 状态 |
|---|---|---|
| Java 包名 | 默认 `com.xxx.treehole` | 已确认 |
| 服务器配置 | 2C4G 起（阿里云/腾讯云学生机 ~100 元/月） | 待购买 |
| 域名 | ~80 元/年（Cloudflare/阿里云），spec 中 `yourdomain.com` 为占位符 | 待购买 |
| 塔罗牌面图片 | Rider-Waite 公版，需下载 78 张 | 实施时获取 |
| 敏感词库 | hutool 自带，可补充 | 实施时配置 |

---

**End of Spec**
