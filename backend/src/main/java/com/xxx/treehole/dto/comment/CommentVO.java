package com.xxx.treehole.dto.comment;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 评论展示对象。
 * parentId=null 是一级评论；非 null 时 children 为空（前端按 parent 平铺）。
 * 软删后 content 显示「该评论已删除」，其余字段保留。
 */
@Data
public class CommentVO {

    private Long id;
    private String content;
    private Boolean isAnonymous;
    private Integer likeCount;
    private Boolean liked;
    private LocalDateTime createdAt;

    private Long authorId;
    private String authorNickname;
    private String authorAvatarUrl;

    private Long parentId;
    private Long replyToUserId;
    private String replyToNickname;

    /** 已删除标记（true 时 content 为占位文案） */
    private Boolean deleted;

    /** 一级评论的子回复（按时间正序） */
    private List<CommentVO> children;

    /** 是否可被当前用户删除（作者或管理员） */
    private Boolean canDelete;
}
