package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xxx.treehole.dto.stats.PlazaStatsVO;
import com.xxx.treehole.entity.Comment;
import com.xxx.treehole.entity.Post;
import com.xxx.treehole.mapper.CommentMapper;
import com.xxx.treehole.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 广场公开统计业务：
 * - 今日新帖数
 * - 累计心声数
 * - 今日温暖指数（基于 mood 平均映射到 0-100）
 * - 今日活跃用户数（发帖或评论的不重复 user_id）
 * <p>
 * 温暖指数算法：
 * mood → {calm:70, sad:40, anxious:30, warm:85, grateful:95}，无 mood=60
 * 取今日所有帖子 mood 平均后四舍五入。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PlazaStatsService {

    /** 心情 → 温暖分值映射（0-100） */
    private static final Map<String, Integer> MOOD_WARMTH = Map.of(
            "calm", 70,
            "sad", 40,
            "anxious", 30,
            "warm", 85,
            "grateful", 95
    );
    private static final int DEFAULT_WARMTH = 60;

    /** 温暖指数 → 标签 */
    private static String warmthLabel(int warmth) {
        if (warmth >= 85) return "温暖";
        if (warmth >= 70) return "平静";
        if (warmth >= 55) return "中性";
        if (warmth >= 40) return "低落";
        return "焦虑";
    }

    private final PostMapper postMapper;
    private final CommentMapper commentMapper;

    public PlazaStatsVO plaza() {
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();

        // 1. 今日新帖
        long todayPosts = countSafe(() -> postMapper.selectCount(
                new LambdaQueryWrapper<Post>()
                        .eq(Post::getStatus, 0)
                        .ge(Post::getCreatedAt, todayStart)));

        // 2. 累计心声
        long totalPosts = countSafe(() -> postMapper.selectCount(
                new LambdaQueryWrapper<Post>().eq(Post::getStatus, 0)));

        // 3. 今日温暖指数（基于 mood 平均）
        List<Post> todayPostsList = postMapper.selectList(
                new LambdaQueryWrapper<Post>()
                        .eq(Post::getStatus, 0)
                        .ge(Post::getCreatedAt, todayStart)
                        .select(Post::getMood));
        int warmth = computeWarmth(todayPostsList);

        // 4. 今日活跃用户（去重 user_id）
        Set<Long> postUserIds = todayPostsList.stream()
                .map(Post::getUserId)
                .collect(Collectors.toSet());
        List<Comment> todayComments = commentMapper.selectList(
                new LambdaQueryWrapper<Comment>()
                        .ge(Comment::getCreatedAt, todayStart)
                        .select(Comment::getUserId));
        Set<Long> commentUserIds = todayComments.stream()
                .map(Comment::getUserId)
                .collect(Collectors.toSet());
        Set<Long> allActive = new java.util.HashSet<>(postUserIds);
        allActive.addAll(commentUserIds);

        PlazaStatsVO vo = new PlazaStatsVO();
        vo.setTodayPosts(todayPosts);
        vo.setTotalPosts(totalPosts);
        vo.setWarmthIndex(warmth);
        vo.setWarmthLabel(warmthLabel(warmth));
        vo.setActiveUsersToday(allActive.size());
        return vo;
    }

    /** 计算温暖指数：今日所有帖子 mood 平均 */
    private int computeWarmth(List<Post> posts) {
        if (posts == null || posts.isEmpty()) return DEFAULT_WARMTH;
        long sum = 0;
        int count = 0;
        for (Post p : posts) {
            Integer w = p.getMood() == null ? null : MOOD_WARMTH.get(p.getMood());
            if (w == null) w = DEFAULT_WARMTH;
            sum += w;
            count++;
        }
        return count == 0 ? DEFAULT_WARMTH : (int) Math.round((double) sum / count);
    }

    private long countSafe(java.util.function.Supplier<Long> supplier) {
        try {
            Long v = supplier.get();
            return v == null ? 0 : v;
        } catch (Exception e) {
            log.warn("Plaza stats count failed: {}", e.getMessage());
            return 0;
        }
    }
}
