-- V8：弹幕（短内容、无嵌套、滚动展示）
-- 与 comments 分离，避免污染评论体系
-- danmaku 通常很短（≤30 字），可匿名，按时间正序滚动

CREATE TABLE danmaku (
    id           BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    post_id      BIGINT       NOT NULL                   COMMENT '所属帖子 ID',
    user_id      BIGINT       NOT NULL                   COMMENT '发送者 ID',
    content      VARCHAR(60)  NOT NULL                   COMMENT '弹幕内容（≤30 中文字符）',
    color        VARCHAR(16)  DEFAULT '#3d7a4d'          COMMENT '弹幕颜色（hex）',
    is_anonymous TINYINT      DEFAULT 0                  COMMENT '是否匿名',
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    INDEX idx_post_created (post_id, created_at) COMMENT '按帖子 + 时间查询'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子弹幕表';
