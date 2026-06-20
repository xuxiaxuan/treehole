package com.xxx.treehole.dto.garden;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 单株植物 VO：一条帖子 = 一株植物。
 * <p>
 * 生长阶段（由 likeCount 推算，KISS 原则，避免引入新字段）：
 * <ul>
 *   <li>0 = 种子 🌰（0 赞）</li>
 *   <li>1 = 嫩芽 🌱（1-2 赞）</li>
 *   <li>2 = 成长 🌿（3-9 赞）</li>
 *   <li>3 = 盛开 🌸（10+ 赞）</li>
 * </ul>
 * 前端按 mood 映射不同植物 emoji（calm→薄荷 / sad→蓝铃 / anxious→风铃草 / warm→向日葵 / grateful→麦穗）。
 */
@Data
public class PlantVO {

    /** 对应的帖子 ID（点击植物可跳转详情） */
    private Long postId;

    /** 心情标签 */
    private String mood;

    /** 生长阶段 0-3 */
    private Integer stage;

    /** 浇水次数（= post.likeCount） */
    private Integer water;

    /** 种植时间（= post.createdAt） */
    private LocalDateTime plantedAt;

    /** 帖子内容的前 50 字（用于 hover tooltip） */
    private String snippet;
}
