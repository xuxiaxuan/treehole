package com.xxx.treehole.dto.stats;

import lombok.Data;

/**
 * 广场公开统计（脱敏版，不含用户/举报等管理数据）。
 * 用于首页统计概览条。
 */
@Data
public class PlazaStatsVO {

    /** 今日新发帖数 */
    private long todayPosts;

    /** 累计心声数（status=0 的帖子总数） */
    private long totalPosts;

    /** 今日温暖指数 0-100（基于 mood 平均） */
    private int warmthIndex;

    /** 今日活跃用户数（发过帖或评论的不重复用户） */
    private long activeUsersToday;

    /** 今日温暖指数标签：温暖/平静/低落/焦虑/感恩 */
    private String warmthLabel;
}
