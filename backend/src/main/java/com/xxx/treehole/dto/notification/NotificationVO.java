package com.xxx.treehole.dto.notification;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 通知展示对象。
 * actorNickname 为 null 时表示匿名触发者（匿名点赞/评论），前端展示为「匿名用户」。
 * snippet 是关联内容的截断（如评论内容前 50 字），前端可展示。
 */
@Data
public class NotificationVO {

    private Long id;
    private String type;             // like_post / comment / reply / follow
    private Long actorId;
    private String actorNickname;
    private String actorAvatarUrl;
    private Long postId;
    private Long commentId;
    private String snippet;          // 评论/回复内容摘要（可选）
    private Boolean read;
    private LocalDateTime createdAt;
}
