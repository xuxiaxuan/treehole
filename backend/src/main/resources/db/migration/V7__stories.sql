-- V7：协作故事
-- stories：故事主体（开头 + 元数据）
-- story_segments：故事的各段续写（按 created_at 正序拼成完整故事）

CREATE TABLE stories (
    id           BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    user_id      BIGINT       NOT NULL                   COMMENT '创建者 ID',
    title        VARCHAR(100) NOT NULL                   COMMENT '故事标题',
    opening      TEXT         NOT NULL                   COMMENT '故事开头（第一段）',
    is_anonymous TINYINT      DEFAULT 0                  COMMENT '是否匿名：0=实名 1=匿名',
    segment_count INT         DEFAULT 1                  COMMENT '段落数（含开头）',
    status       TINYINT      DEFAULT 0                  COMMENT '0=进行中 1=完结',
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_updated (status, updated_at DESC) COMMENT '加速列表按最新更新排序'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='协作故事表';

CREATE TABLE story_segments (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    story_id    BIGINT       NOT NULL                   COMMENT '所属故事 ID',
    user_id     BIGINT       NOT NULL                   COMMENT '续写者 ID',
    content     TEXT         NOT NULL                   COMMENT '续写内容（≤200 字）',
    is_anonymous TINYINT     DEFAULT 0                  COMMENT '是否匿名',
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    INDEX idx_story_created (story_id, created_at) COMMENT '按时间正序拼装故事'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='故事续写段落表';
