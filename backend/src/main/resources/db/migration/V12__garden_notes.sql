-- V12：心情花园改造 —— 私人心情日记
-- 设计变更：
--   旧版：复用 posts.mood，花园 = 帖子可视化（和广场重复）
--   新版：garden_notes 独立表，默认私密；可选「移植到广场」转成 post
--
-- 字段设计：
--   stage：生长阶段 0-3（每天打开花园自动 +1，封顶 3）
--   water_count：用户自己浇过几次（额外加速生长）
--   transplanted_post_id：移植到广场后的 posts.id，NULL=未移植
--   last_watered_at：上次浇水时间，用于限制每天最多浇一次
--
-- 与 posts 关系：完全独立。移植时 CapsuleService 风格调 PostService.create。

CREATE TABLE garden_notes (
    id                    BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    user_id               BIGINT       NOT NULL                   COMMENT '作者（只有自己能看）',
    content               TEXT         NOT NULL                   COMMENT '心情日记内容',
    mood                  VARCHAR(16)                             COMMENT '心情：calm/sad/anxious/warm/grateful',
    stage                 TINYINT      DEFAULT 0                  COMMENT '生长阶段 0-3',
    water_count           INT          DEFAULT 0                  COMMENT '浇水次数',
    last_watered_at       DATETIME                                COMMENT '上次浇水时间',
    transplanted_post_id  BIGINT                                  COMMENT '移植到广场后的 post.id',
    created_at            DATETIME     DEFAULT CURRENT_TIMESTAMP  COMMENT '种植时间',
    INDEX idx_user (user_id, created_at DESC) COMMENT '按作者查花园'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='私人心情花园日记';
