package com.xxx.treehole.dto.story;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class StoryVO {

    private Long id;
    private String title;
    private String opening;
    private Boolean isAnonymous;
    private Integer segmentCount;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Long authorId;
    private String authorNickname;
    private String authorAvatarUrl;

    /** 续写段落（按时间正序，不含开头） */
    private List<StorySegmentVO> segments;
}
