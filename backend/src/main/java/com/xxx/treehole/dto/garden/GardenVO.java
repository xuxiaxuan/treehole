package com.xxx.treehole.dto.garden;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 心情花园 VO：用户视角的花园状态。
 * <p>
 * 设计原则：完全复用 Post.mood + Post.likeCount，不建新表。
 * <ul>
 *   <li>{@link #plants} — 每株植物对应一条带 mood 的帖子，生长阶段由 likeCount 推算</li>
 *   <li>{@link #stats} — 按 mood 的简单统计（该用户共种下多少株）</li>
 * </ul>
 */
@Data
public class GardenVO {

    /** 花园主人 ID */
    private Long userId;

    /** 花园主人昵称（匿名用户显示"匿名旅人"） */
    private String nickname;

    /** 是否当前登录用户自己的花园 */
    private Boolean mine;

    /** 所有植物列表（按 createdAt 正序，便于"种植时间线"渲染） */
    private List<PlantVO> plants;

    /** 统计：按 mood 分组株数，{calm: 3, sad: 1, ...} */
    private Map<String, Integer> stats;

    /** 累计浇水次数（所有帖子的 likeCount 总和） */
    private int totalWater;
}
