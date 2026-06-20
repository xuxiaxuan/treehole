-- 生产环境 MySQL 8.x 初始化脚本
-- 手动执行：mysql -u root -p treehole < V1__init.sql
-- 所有表与字段均带 COMMENT，便于运维通过 information_schema 快速理解结构

-- ============================================================
-- 用户表：注册账号、角色与状态
-- ============================================================
CREATE TABLE users (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    email         VARCHAR(128) UNIQUE NOT NULL            COMMENT '邮箱（唯一，用于登录）',
    password_hash VARCHAR(128) NOT NULL                   COMMENT '密码哈希值（BCrypt 加密，不存储明文）',
    nickname      VARCHAR(32)                             COMMENT '昵称（前端展示用）',
    avatar_url    VARCHAR(256)                            COMMENT '头像 URL',
    role          TINYINT      DEFAULT 0                  COMMENT '角色：0=普通用户 1=管理员',
    status        TINYINT      DEFAULT 0                  COMMENT '状态：0=正常 1=封禁',
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP       COMMENT '创建时间',
    updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间（自动维护）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表：账号、角色、状态';

-- ============================================================
-- 帖子表：树洞 / 塔罗分享
-- ============================================================
CREATE TABLE posts (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    user_id       BIGINT       NOT NULL                   COMMENT '发帖用户 ID（逻辑关联 users.id）',
    is_anonymous  TINYINT      DEFAULT 0                  COMMENT '是否匿名：0=实名 1=匿名',
    content       TEXT         NOT NULL                   COMMENT '帖子正文内容（最长 2000 字，业务层校验）',
    post_type     TINYINT      DEFAULT 0                  COMMENT '帖子类型：0=树洞 1=塔罗分享',
    tarot_data    JSON                                    COMMENT '塔罗牌数据（仅 post_type=1 时使用）：{cards, spread, reading}',
    like_count    INT          DEFAULT 0                  COMMENT '点赞数（冗余计数，避免 COUNT 查询）',
    status        TINYINT      DEFAULT 0                  COMMENT '状态：0=正常 1=隐藏（管理员操作） 2=删除',
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP       COMMENT '创建时间',
    updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间（自动维护）',
    INDEX idx_status_created (status, created_at DESC) COMMENT '加速广场列表查询（按状态过滤 + 时间倒序）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子表：树洞与塔罗分享内容';

-- ============================================================
-- 点赞表：用户与帖子的点赞关系
-- ============================================================
CREATE TABLE likes (
    id         BIGINT   AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    user_id    BIGINT   NOT NULL                   COMMENT '点赞用户 ID（逻辑关联 users.id）',
    post_id    BIGINT   NOT NULL                   COMMENT '被点赞帖子 ID（逻辑关联 posts.id）',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP  COMMENT '点赞时间',
    UNIQUE KEY uk_user_post (user_id, post_id) COMMENT '唯一约束：同一用户对同一帖子只能点赞一次'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞表：用户-帖子点赞关系';

-- ============================================================
-- 举报表：用户举报帖子，管理员审核
-- ============================================================
CREATE TABLE reports (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    reporter_id BIGINT       NOT NULL                   COMMENT '举报人 ID（逻辑关联 users.id）',
    post_id     BIGINT       NOT NULL                   COMMENT '被举报帖子 ID（逻辑关联 posts.id）',
    reason      VARCHAR(256)                            COMMENT '举报理由（预设理由 + 用户补充）',
    status      TINYINT      DEFAULT 0                  COMMENT '状态：0=待处理 1=已处理',
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP  COMMENT '举报时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='举报表：用户举报记录，管理员审核队列';
