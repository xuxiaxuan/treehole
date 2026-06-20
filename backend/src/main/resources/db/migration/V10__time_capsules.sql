-- V10：时间胶囊
-- 用户可"封印"一条心声，到指定时间才在广场显形。
-- reveal_at 到达时，定时任务创建对应 post 并回填 post_id、标记 revealed=1。
--
-- 与 posts 表关系：
--   1. 创建时：写入 capsules，posts 不动
--   2. 到时间：CapsuleService.scan() 创建 post，回填 post_id + revealed=1
--   3. 已发布的胶囊仍可正常被点赞/评论/举报，与普通帖子无差异

CREATE TABLE time_capsules (
    id           BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    user_id      BIGINT       NOT NULL                   COMMENT '胶囊作者',
    content      TEXT         NOT NULL                   COMMENT '心声内容（封印期间不公开）',
    mood         VARCHAR(16)                             COMMENT '心情标签（与 posts.mood 一致）',
    is_anonymous TINYINT      DEFAULT 0                  COMMENT '揭封后是否匿名出现在广场',
    reveal_at    DATETIME     NOT NULL                   COMMENT '揭封时间（到达后转 post）',
    revealed     TINYINT      DEFAULT 0                  COMMENT '0=封印中 1=已揭封',
    post_id      BIGINT                                  COMMENT '揭封后生成的 posts.id',
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    INDEX idx_reveal_pending (revealed, reveal_at) COMMENT '定时任务扫描待揭封胶囊',
    INDEX idx_user (user_id, created_at DESC) COMMENT '按作者查胶囊列表'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='时间胶囊表';
