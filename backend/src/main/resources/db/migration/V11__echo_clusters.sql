-- V11：共鸣信号（Echo Pulse）
-- 每晚 03:00 定时任务：
--   1. 拉取过去 24h status=0 帖子
--   2. 调 LLM 计算每帖 embedding
--   3. 基于余弦相似度做层次聚类，size>=2 的 cluster 入库
--   4. 给每个 cluster 调 LLM 生成一句话主题摘要
-- 用户次日登录看到 "昨夜有 N 人共鸣"，点击进入匿名聚合页。

CREATE TABLE echo_clusters (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    cluster_date  DATE         NOT NULL                   COMMENT '归属日期（昨晚）',
    summary       VARCHAR(256) NOT NULL                   COMMENT 'AI 生成的一句话主题摘要',
    member_count  INT          DEFAULT 0                  COMMENT '成员帖子数',
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP  COMMENT '生成时间',
    UNIQUE KEY uk_date_summary (cluster_date, summary) COMMENT '同日同主题去重',
    INDEX idx_date (cluster_date DESC) COMMENT '按日期倒排'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='共鸣信号聚类';

CREATE TABLE echo_cluster_members (
    id           BIGINT   AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    cluster_id   BIGINT   NOT NULL                   COMMENT '所属 cluster',
    post_id      BIGINT   NOT NULL                   COMMENT '关联帖子',
    user_id      BIGINT   NOT NULL                   COMMENT '帖子作者',
    UNIQUE KEY uk_cluster_post (cluster_id, post_id) COMMENT '唯一约束',
    INDEX idx_post (post_id),
    INDEX idx_cluster (cluster_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='共鸣信号成员';
