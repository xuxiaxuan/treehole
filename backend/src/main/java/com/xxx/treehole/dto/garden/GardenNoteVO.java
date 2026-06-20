package com.xxx.treehole.dto.garden;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 心情日记 VO：仅作者本人能拿到完整字段。
 */
@Data
public class GardenNoteVO {

    private Long id;
    private String content;
    private String mood;
    /** 生长阶段 0-3 */
    private Integer stage;
    /** 浇水次数 */
    private Integer waterCount;
    private LocalDateTime lastWateredAt;
    /** 是否已移植到广场 */
    private Boolean transplanted;
    /** 移植后的帖子 ID（前端跳转用） */
    private Long postId;
    private LocalDateTime createdAt;

    /** 今天是否还能浇水（24h 一次） */
    private Boolean canWater;
    /** 是否还能移植（已移植的不能重复） */
    private Boolean canTransplant;
}
