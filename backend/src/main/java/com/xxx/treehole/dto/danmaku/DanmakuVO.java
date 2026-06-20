package com.xxx.treehole.dto.danmaku;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DanmakuVO {

    private Long id;
    private String content;
    private String color;
    private Boolean isAnonymous;
    private LocalDateTime createdAt;
    /** 滚动轨道（0-9），前端按此分配 lane 避免重叠 */
    private Integer lane;
    private String authorNickname;
}
