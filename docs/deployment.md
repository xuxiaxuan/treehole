# 部署文档

## 一、后端部署（Docker Compose）

### 1. 准备服务器
- 2C4G 起（阿里云/腾讯云学生机即可）
- Docker + Docker Compose 已安装
- 80/443 端口开放

### 2. 部署步骤

```bash
# SSH 到服务器
ssh root@your-server

# 克隆仓库
git clone <your-repo-url> treehole
cd treehole

# 配置环境变量
cp .env.example .env
nano .env
# 必须修改：
#   MYSQL_ROOT_PASSWORD  (强密码)
#   MYSQL_PASSWORD       (强密码)
#   JWT_SECRET           (64 字符随机串，可用 openssl rand -hex 32 生成)
#   WEB_DOMAIN=https://yourdomain.com
#   ADMIN_DOMAIN=https://admin.yourdomain.com

# 修改 Caddyfile 中的 yourdomain.com 为实际域名
nano Caddyfile

# 启动
docker compose up -d --build

# 查看启动日志
docker compose logs -f app
```

### 3. DNS 配置
- A 记录：`yourdomain.com` → 服务器 IP
- CNAME：`admin.yourdomain.com` → Cloudflare Pages 域名（部署后获得）

### 4. 验证
```bash
curl https://yourdomain.com/api/tarot/deck
# 期望返回 JSON，含 22 张大阿尔卡那 + 4 张小阿尔卡那
```

---

## 二、前端部署（Cloudflare Pages）

### 方式 A：CLI 部署
```bash
npm install -g wrangler
wrangler login

cd web
npm install && npm run build
wrangler pages deploy dist --project-name=treehole-web

cd ../admin-web
npm install && npm run build
wrangler pages deploy dist --project-name=treehole-admin
```

### 方式 B：Dashboard 自动部署（推荐）
1. Cloudflare Dashboard → Pages → Create a project → Connect Git
2. 配置两个项目：
   | 项目 | 根目录 | Build command | Output |
   |---|---|---|---|
   | treehole-web | `web` | `npm install && npm run build` | `web/dist` |
   | treehole-admin | `admin-web` | `npm install && npm run build` | `admin-web/dist` |
3. 环境变量：`VITE_API_BASE_URL=https://yourdomain.com/api`
4. 绑定自定义域名：`yourdomain.com` 和 `admin.yourdomain.com`

### 管理端二次保护（重要）
在 Cloudflare Dashboard 为 `admin.yourdomain.com` 启用 **Cloudflare Access**：
- 只允许你的 IP / 邮箱域 / 特定 Google 账号访问
- 免费层足够个人项目使用

---

## 三、第一个管理员账号

```bash
# 进入 MySQL 容器
docker compose exec mysql mysql -u root -p treehole
# 输入 MYSQL_ROOT_PASSWORD

# 执行（替换为你的邮箱）
UPDATE users SET role=1 WHERE email='your@email.com';
exit
```

然后用该账号登录 `admin.yourdomain.com`。

---

## 四、MySQL 自动备份

```bash
mkdir -p /backup
crontab -e
# 添加（每天 03:00 备份，保留 7 天）：
0 3 * * * docker compose -f /root/treehole/docker-compose.yml exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD treehole | gzip > /backup/$(date +\%Y\%m\%d).sql.gz && find /backup -mtime +7 -delete
```

---

## 五、端到端验证清单

| # | 操作 | 期望 |
|---|---|---|
| 1 | 访问 `yourdomain.com` | 看到广场页（可能为空） |
| 2 | 注册账号 | 注册成功，自动登录 |
| 3 | 发实名帖 | 广场出现，显示昵称 |
| 4 | 发匿名帖 | 广场出现，显示"匿名用户" |
| 5 | 点赞 / 取消 | 数字正确变化 |
| 6 | 举报帖子 | 提示已提交 |
| 7 | 塔罗占卜 | 抽 3 张牌，分享到广场 |
| 8 | 访问 `admin.yourdomain.com` | Cloudflare Access 拦截 |
| 9 | 管理员登录 | 进入后台 |
| 10 | 帖子管理 → 隐藏 | web/ 广场看不到该帖 |
| 11 | 举报队列 → 删帖 | 帖子被删除 |
| 12 | 用户管理 → 封禁 | 该用户无法登录 |
| 13 | 用户管理 → 设为管理员 | 新管理员可登录 admin |

---

## 六、（可选）Sentry 错误监控

```xml
<!-- backend/pom.xml -->
<dependency>
  <groupId>io.sentry</groupId>
  <artifactId>sentry-spring-boot-starter-jakarta</artifactId>
  <version>7.6.0</version>
</dependency>
```

```yaml
# application.yml
sentry:
  dsn: ${SENTRY_DSN:}
  traces-sample-rate: 1.0
```

免费层 5K errors/月，个人项目足够。
