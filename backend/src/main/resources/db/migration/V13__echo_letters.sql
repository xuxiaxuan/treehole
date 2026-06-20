-- V13：共鸣信号升级 —— 匿名信件 + 房间归档
-- 设计变更：
--   旧版：共鸣房间只展示已有帖子（和广场重复）
--   新版：房间内可写匿名信，22:00 揭信，24h 后归档（限时性）
--
-- 改动 1：echo_clusters 加 archived 字段（0=开放 1=已归档）
--   归档后房间只读，不能再写信
ALTER TABLE echo_clusters
    ADD COLUMN archived TINYINT DEFAULT 0 COMMENT '0=开放 1=已归档（24h 后）';

-- 改动 2：新建 echo_letters 表（房间内匿名短信）
CREATE TABLE echo_letters (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    cluster_id    BIGINT       NOT NULL                   COMMENT '所属共鸣房间',
    from_user_id  BIGINT       NOT NULL                   COMMENT '写信人',
    content       VARCHAR(200) NOT NULL                   COMMENT '信件内容（≤100 中文字符）',
    revealed      TINYINT      DEFAULT 0                  COMMENT '0=封缄 1=已揭信（22:00 后）',
    revealed_at   DATETIME                                COMMENT '揭信时间（写入时计算）',
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP  COMMENT '写信时间',
    INDEX idx_cluster_revealed (cluster_id, revealed) COMMENT '按房间查揭信状态',
    INDEX idx_user_cluster (from_user_id, cluster_id) COMMENT '防同一人重复写'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='共鸣房间匿名信件';

-- 同一房间每人最多 1 封（避免刷屏），通过应用层校验即可，不加 UNIQUE 约束以便未来放宽
