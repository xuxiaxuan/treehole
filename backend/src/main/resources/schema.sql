-- H2 测试库用 schema（兼顾 MySQL 语法）
-- 生产用 db/migration/V1__init.sql
-- H2 对 COMMENT 关键字支持有限，这里用 SQL 行注释标注字段含义；结构与 V1__init.sql 保持一致

-- ============================================================
-- 用户表：注册账号、角色与状态
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,                -- 主键 ID
    email         VARCHAR(128) UNIQUE NOT NULL,                           -- 邮箱（唯一，用于登录）
    password_hash VARCHAR(128) NOT NULL,                                  -- 密码哈希值（BCrypt 加密）
    nickname      VARCHAR(32),                                            -- 昵称（前端展示用）
    birthday      DATE,                                                   -- 生日（可选，用于 AI 塔罗抽牌）
    avatar_url    VARCHAR(256),                                           -- 头像 URL
    role          TINYINT      DEFAULT 0,                                 -- 角色：0=普通用户 1=管理员
    status        TINYINT      DEFAULT 0,                                 -- 状态：0=正常 1=封禁
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,                 -- 创建时间
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP                  -- 更新时间
);

-- ============================================================
-- 帖子表：树洞 / 塔罗分享
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,                -- 主键 ID
    user_id       BIGINT       NOT NULL,                                  -- 发帖用户 ID（关联 users.id）
    is_anonymous  TINYINT      DEFAULT 0,                                 -- 是否匿名：0=实名 1=匿名
    content       TEXT         NOT NULL,                                  -- 帖子正文内容
    mood          VARCHAR(16),                                            -- 心情：calm/sad/anxious/warm/grateful
    ai_summary    VARCHAR(500),                                           -- AI 摘要（管理员触发，可空）
    ai_tags       VARCHAR(128),                                           -- AI 标签（逗号分隔，可空）
    post_type     TINYINT      DEFAULT 0,                                 -- 帖子类型：0=树洞 1=塔罗分享
    tarot_data    CLOB,                                                   -- 塔罗牌数据 JSON（H2 用 CLOB；MySQL 用 JSON）
    like_count    INT          DEFAULT 0,                                 -- 点赞数（冗余计数）
    status        TINYINT      DEFAULT 0,                                 -- 状态：0=正常 1=隐藏 2=删除
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,                 -- 创建时间
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP                  -- 更新时间
);
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts (status, created_at DESC);  -- 加速广场列表查询

-- ============================================================
-- 点赞表：用户与帖子的点赞关系
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
    id         BIGINT   AUTO_INCREMENT PRIMARY KEY,                       -- 主键 ID
    user_id    BIGINT   NOT NULL,                                          -- 点赞用户 ID（关联 users.id）
    post_id    BIGINT   NOT NULL,                                          -- 被点赞帖子 ID（关联 posts.id）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                        -- 点赞时间
    CONSTRAINT uk_user_post UNIQUE (user_id, post_id)                      -- 唯一约束：防止重复点赞
);

-- ============================================================
-- 举报表：用户举报帖子，管理员审核
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,                  -- 主键 ID
    reporter_id BIGINT       NOT NULL,                                     -- 举报人 ID（关联 users.id）
    post_id     BIGINT       NOT NULL,                                     -- 被举报帖子 ID（关联 posts.id）
    reason      VARCHAR(256),                                              -- 举报理由
    status      TINYINT      DEFAULT 0,                                    -- 状态：0=待处理 1=已处理
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP                     -- 举报时间
);

-- ============================================================
-- 评论表：2 级嵌套（parent_id=NULL 一级，否则回复）
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
    id               BIGINT       AUTO_INCREMENT PRIMARY KEY,             -- 主键 ID
    post_id          BIGINT       NOT NULL,                                -- 所属帖子 ID
    user_id          BIGINT       NOT NULL,                                -- 评论作者 ID
    parent_id        BIGINT,                                               -- 父评论 ID（NULL=一级）
    reply_to_user_id BIGINT,                                               -- @目标用户 ID（平铺用）
    content          TEXT         NOT NULL,                                -- 评论内容
    is_anonymous     TINYINT      DEFAULT 0,                               -- 是否匿名
    like_count       INT          DEFAULT 0,                               -- 点赞数（冗余）
    status           TINYINT      DEFAULT 0,                               -- 0=正常 1=用户删 2=管理员删
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,               -- 创建时间
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP                -- 更新时间
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id);

-- ============================================================
-- 评论点赞表
-- ============================================================
CREATE TABLE IF NOT EXISTS comment_likes (
    id          BIGINT   AUTO_INCREMENT PRIMARY KEY,                       -- 主键 ID
    user_id     BIGINT   NOT NULL,                                         -- 点赞用户 ID
    comment_id  BIGINT   NOT NULL,                                         -- 评论 ID
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                       -- 点赞时间
    CONSTRAINT uk_user_comment UNIQUE (user_id, comment_id)                -- 唯一约束
);

-- ============================================================
-- 通知表：点赞/评论/回复/关注
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,                   -- 主键 ID
    user_id     BIGINT       NOT NULL,                                     -- 接收者 ID
    actor_id    BIGINT       NOT NULL,                                     -- 触发者 ID
    type        VARCHAR(32)  NOT NULL,                                     -- like_post/comment/reply/follow
    post_id     BIGINT,                                                   -- 关联帖子
    comment_id  BIGINT,                                                   -- 关联评论
    `read`      TINYINT      DEFAULT 0,                                    -- 0=未读 1=已读
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP                     -- 创建时间
);
CREATE INDEX IF NOT EXISTS idx_notif_user_read ON notifications (user_id, `read`, created_at DESC);

-- ============================================================
-- 收藏表：复用 likes 表的 UNIQUE(user_id, post_id) 模式
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
    id          BIGINT   AUTO_INCREMENT PRIMARY KEY,                       -- 主键 ID
    user_id     BIGINT   NOT NULL,                                         -- 收藏者 ID
    post_id     BIGINT   NOT NULL,                                         -- 帖子 ID
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                       -- 收藏时间
    CONSTRAINT uk_user_post_fav UNIQUE (user_id, post_id)                  -- 唯一约束
);
CREATE INDEX IF NOT EXISTS idx_fav_user ON favorites (user_id, created_at DESC);

-- ============================================================
-- 关注表：follower_id 关注 followee_id
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
    id           BIGINT   AUTO_INCREMENT PRIMARY KEY,                      -- 主键 ID
    follower_id  BIGINT   NOT NULL,                                        -- 关注者 ID
    followee_id  BIGINT   NOT NULL,                                        -- 被关注者 ID
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                      -- 关注时间
    CONSTRAINT uk_follower_followee UNIQUE (follower_id, followee_id)      -- 唯一约束
);
CREATE INDEX IF NOT EXISTS idx_follow_followee ON follows (followee_id);
CREATE INDEX IF NOT EXISTS idx_follow_follower ON follows (follower_id);

-- ============================================================
-- 协作故事：stories + story_segments
-- ============================================================
CREATE TABLE IF NOT EXISTS stories (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,                 -- 主键 ID
    user_id       BIGINT       NOT NULL,                                   -- 创建者 ID
    title         VARCHAR(100) NOT NULL,                                   -- 故事标题
    opening       TEXT         NOT NULL,                                   -- 开头段落
    is_anonymous  TINYINT      DEFAULT 0,                                  -- 是否匿名
    segment_count INT          DEFAULT 1,                                  -- 段落数
    status        TINYINT      DEFAULT 0,                                  -- 0=进行中 1=完结
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,                  -- 创建时间
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP                   -- 更新时间
);
CREATE INDEX IF NOT EXISTS idx_stories_updated ON stories (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS story_segments (
    id           BIGINT    AUTO_INCREMENT PRIMARY KEY,                     -- 主键 ID
    story_id     BIGINT    NOT NULL,                                       -- 所属故事 ID
    user_id      BIGINT    NOT NULL,                                       -- 续写者 ID
    content      TEXT      NOT NULL,                                       -- 续写内容
    is_anonymous TINYINT   DEFAULT 0,                                      -- 是否匿名
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP                       -- 创建时间
);
CREATE INDEX IF NOT EXISTS idx_segments_story ON story_segments (story_id, created_at);

-- ============================================================
-- 弹幕表：短内容（≤30 字）、滚动展示
-- ============================================================
CREATE TABLE IF NOT EXISTS danmaku (
    id           BIGINT       AUTO_INCREMENT PRIMARY KEY,                 -- 主键 ID
    post_id      BIGINT       NOT NULL,                                   -- 帖子 ID
    user_id      BIGINT       NOT NULL,                                   -- 发送者 ID
    content      VARCHAR(60)  NOT NULL,                                   -- 内容（≤30 中文字符）
    color        VARCHAR(16)  DEFAULT '#3d7a4d',                          -- 颜色
    is_anonymous TINYINT      DEFAULT 0,                                  -- 是否匿名
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP                   -- 创建时间
);
CREATE INDEX IF NOT EXISTS idx_danmaku_post ON danmaku (post_id, created_at);

-- ============================================================
-- 时间胶囊：到时间才显形的帖子
-- ============================================================
CREATE TABLE IF NOT EXISTS time_capsules (
    id           BIGINT       AUTO_INCREMENT PRIMARY KEY,                 -- 主键 ID
    user_id      BIGINT       NOT NULL,                                   -- 作者 ID
    content      CLOB         NOT NULL,                                   -- 心声内容
    mood         VARCHAR(16),                                             -- 心情（可空）
    is_anonymous TINYINT      DEFAULT 0,                                  -- 揭封后是否匿名
    reveal_at    TIMESTAMP    NOT NULL,                                   -- 揭封时间
    revealed     TINYINT      DEFAULT 0,                                  -- 0=封印 1=已揭
    post_id      BIGINT,                                                  -- 揭封后 post.id
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP                   -- 创建时间
);
CREATE INDEX IF NOT EXISTS idx_capsule_reveal ON time_capsules (revealed, reveal_at);
CREATE INDEX IF NOT EXISTS idx_capsule_user ON time_capsules (user_id, created_at DESC);

-- ============================================================
-- 共鸣信号：每晚聚类的相似帖子组
-- ============================================================
CREATE TABLE IF NOT EXISTS echo_clusters (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,                -- 主键 ID
    cluster_date  DATE         NOT NULL,                                  -- 归属日期（昨晚）
    summary       VARCHAR(256),                                           -- AI 生成的一句话主题
    member_count  INT          DEFAULT 0,                                 -- 成员帖子数
    archived      TINYINT      DEFAULT 0,                                 -- 0=开放 1=已归档（24h 后）
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,                 -- 生成时间
    UNIQUE (cluster_date, summary)                                        -- 同日同主题去重
);

CREATE TABLE IF NOT EXISTS echo_cluster_members (
    id           BIGINT   AUTO_INCREMENT PRIMARY KEY,                     -- 主键 ID
    cluster_id   BIGINT   NOT NULL,                                       -- 所属 cluster
    post_id      BIGINT   NOT NULL,                                       -- 关联帖子
    user_id      BIGINT   NOT NULL,                                       -- 帖子作者
    UNIQUE (cluster_id, post_id)                                           -- 唯一约束
);
CREATE INDEX IF NOT EXISTS idx_echo_member_post ON echo_cluster_members (post_id);
CREATE INDEX IF NOT EXISTS idx_echo_cluster_date ON echo_clusters (cluster_date DESC);

-- ============================================================
-- 共鸣信件：房间内匿名短信（24h 后随房间归档）
-- ============================================================
CREATE TABLE IF NOT EXISTS echo_letters (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,                -- 主键 ID
    cluster_id    BIGINT       NOT NULL,                                  -- 所属共鸣房间
    from_user_id  BIGINT       NOT NULL,                                  -- 写信人
    content       VARCHAR(200) NOT NULL,                                  -- 信件内容（≤100 中文字符）
    revealed      TINYINT      DEFAULT 0,                                 -- 0=封缄 1=已揭信（22:00 后）
    revealed_at   TIMESTAMP,                                              -- 揭信时间（写入时计算）
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,                 -- 写信时间
    CONSTRAINT uk_echo_user_cluster UNIQUE (from_user_id, cluster_id)     -- 每用户每房间限 1 封
);
CREATE INDEX IF NOT EXISTS idx_letter_cluster ON echo_letters (cluster_id, revealed);

-- ============================================================
-- 私人心情花园：独立于 posts 的私密日记
-- ============================================================
CREATE TABLE IF NOT EXISTS garden_notes (
    id                    BIGINT       AUTO_INCREMENT PRIMARY KEY,        -- 主键 ID
    user_id               BIGINT       NOT NULL,                          -- 作者（私有）
    content               CLOB         NOT NULL,                          -- 日记内容
    mood                  VARCHAR(16),                                    -- 心情标签
    stage                 TINYINT       DEFAULT 0,                        -- 生长阶段 0-3
    water_count           INT           DEFAULT 0,                        -- 浇水次数
    last_watered_at       TIMESTAMP,                                      -- 上次浇水
    transplanted_post_id  BIGINT,                                         -- 移植到广场的 post.id
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP          -- 种植时间
);
CREATE INDEX IF NOT EXISTS idx_garden_user ON garden_notes (user_id, created_at DESC);
