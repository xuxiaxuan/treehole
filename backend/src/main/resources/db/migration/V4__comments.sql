-- V4：评论 + 评论点赞
-- 评论采用「2 级展示」策略：parent_id=NULL 是一级评论，否则是回复
-- 数据库不限制层级深度，但 UI 上第 3 级开始平铺到第 2 级（用 reply_to_user_id 的 @用户名 引用）
-- status: 0=正常 1=用户软删 2=管理员软删（软删后内容显示「该评论已删除」）

CREATE TABLE comments (
    id               BIGINT       AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    post_id          BIGINT       NOT NULL                   COMMENT '所属帖子 ID',
    user_id          BIGINT       NOT NULL                   COMMENT '评论作者 ID',
    parent_id        BIGINT       NULL                       COMMENT '父评论 ID；NULL=一级评论',
    reply_to_user_id BIGINT       NULL                       COMMENT '@目标用户 ID（第 3 级平铺时用于展示）',
    content          TEXT         NOT NULL                   COMMENT '评论内容（纯文本，业务层限制长度）',
    is_anonymous     TINYINT      DEFAULT 0                  COMMENT '是否匿名：0=实名 1=匿名',
    like_count       INT          DEFAULT 0                  COMMENT '点赞数（冗余计数）',
    status           TINYINT      DEFAULT 0                  COMMENT '0=正常 1=用户删除 2=管理员删除',
    created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP       COMMENT '创建时间',
    updated_at       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_post_created (post_id, status, created_at) COMMENT '加速帖子评论列表查询',
    INDEX idx_parent (parent_id) COMMENT '加速父评论下子评论查询'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子评论表：支持 2 级嵌套 + 匿名';

CREATE TABLE comment_likes (
    id          BIGINT   AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    user_id     BIGINT   NOT NULL                   COMMENT '点赞用户 ID',
    comment_id  BIGINT   NOT NULL                   COMMENT '被点赞的评论 ID',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP  COMMENT '点赞时间',
    UNIQUE KEY uk_user_comment (user_id, comment_id) COMMENT '同用户对同评论只能点赞一次'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论点赞表';
