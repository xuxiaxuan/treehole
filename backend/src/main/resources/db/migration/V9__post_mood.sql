-- V9：帖子心情字段
-- mood 取值：calm/sad/anxious/warm/grateful（5 种，发帖页可选）
-- 用于「心情热力图」聚合统计：最近 30 天 × 5 种心情的帖子数矩阵

ALTER TABLE posts
    ADD COLUMN mood VARCHAR(16) NULL COMMENT '心情标签：calm/sad/anxious/warm/grateful' AFTER content;
