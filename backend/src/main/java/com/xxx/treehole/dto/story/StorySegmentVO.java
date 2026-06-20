package com.xxx.treehole.dto.story;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StorySegmentVO {

    private Long id;
    private String content;
    private Boolean isAnonymous;
    private LocalDateTime createdAt;
    private Long authorId;
    private String authorNickname;
    private String authorAvatarUrl;
}
