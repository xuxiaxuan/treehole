-- V6：收藏 + 关注
-- favorites：用户收藏帖子（复用 likes 表的 UNIQUE(user_id, post_id) 模式）
-- follows：用户关注用户（follower 关注 followee）

CREATE TABLE favorites (
    id          BIGINT   AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    user_id     BIGINT   NOT NULL                   COMMENT '收藏者 ID',
    post_id     BIGINT   NOT NULL                   COMMENT '被收藏的帖子 ID',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP  COMMENT '收藏时间',
    UNIQUE KEY uk_user_post_fav (user_id, post_id) COMMENT '防止重复收藏',
    INDEX idx_user_created (user_id, created_at DESC) COMMENT '我的收藏列表'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子收藏表';

CREATE TABLE follows (
    id           BIGINT   AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    follower_id  BIGINT   NOT NULL                   COMMENT '关注者 ID',
    followee_id  BIGINT   NOT NULL                   COMMENT '被关注者 ID',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP  COMMENT '关注时间',
    UNIQUE KEY uk_follower_followee (follower_id, followee_id) COMMENT '防止重复关注',
    INDEX idx_followee (followee_id) COMMENT '某人的粉丝列表',
    INDEX idx_follower (follower_id) COMMENT '我关注的人列表'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注关系表';
