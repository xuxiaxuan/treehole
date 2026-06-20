-- V5：通知系统
-- 记录点赞 / 评论 / 回复 等互动事件，驱动 Navbar 红点
-- type: like_post=点赞你的帖子  comment=评论你的帖子  reply=回复你的评论  follow=关注你
-- read: 0=未读 1=已读
-- actor_id 是触发者；user_id 是接收者；post_id/comment_id 用于跳转
-- 不允许给自己发通知（业务层过滤）

CREATE TABLE notifications (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    user_id     BIGINT       NOT NULL                   COMMENT '通知接收者 ID',
    actor_id    BIGINT       NOT NULL                   COMMENT '触发者 ID',
    type        VARCHAR(32)  NOT NULL                   COMMENT 'like_post/comment/reply/follow',
    post_id     BIGINT       NULL                       COMMENT '关联帖子 ID（点赞/评论类有）',
    comment_id  BIGINT       NULL                       COMMENT '关联评论 ID（评论/回复类有）',
    `read`      TINYINT      DEFAULT 0                  COMMENT '0=未读 1=已读',
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    INDEX idx_user_read (user_id, `read`, created_at DESC) COMMENT '加速未读列表 + 计数',
    INDEX idx_actor_type (actor_id, type) COMMENT '加速反查（可选，便于去重）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表：点赞/评论/回复/关注';
