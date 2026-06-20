package com.xxx.treehole.dto.post;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 帖子对外展示对象。
 * 匿名帖：authorId/authorNickname/authorAvatarUrl 留空（前端按 isAnonymous 渲染）
 */
@Data
public class PostVO {

    private Long id;
    private String content;
    private Integer postType;
    private Object tarotData;
    private Integer likeCount;
    private Boolean liked;
    private LocalDateTime createdAt;

    /** 心情标签：calm/sad/anxious/warm/grateful（可空） */
    private String mood;

    private Boolean isAnonymous;
    private Long authorId;
    private String authorNickname;
    private String authorAvatarUrl;
}
