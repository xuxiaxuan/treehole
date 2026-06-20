package com.xxx.treehole.service.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xxx.treehole.entity.Comment;
import com.xxx.treehole.entity.Favorite;
import com.xxx.treehole.entity.Follow;
import com.xxx.treehole.entity.Notification;
import com.xxx.treehole.entity.Post;
import com.xxx.treehole.entity.Report;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.CommentMapper;
import com.xxx.treehole.mapper.FavoriteMapper;
import com.xxx.treehole.mapper.FollowMapper;
import com.xxx.treehole.mapper.NotificationMapper;
import com.xxx.treehole.mapper.PostMapper;
import com.xxx.treehole.mapper.ReportMapper;
import com.xxx.treehole.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理端数据看板聚合：总量 + 最近 14 天趋势 + 待办指标。
 * 所有统计基于 status（软删）过滤，未硬删的也保留展示。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final UserMapper userMapper;
    private final PostMapper postMapper;
    private final CommentMapper commentMapper;
    private final ReportMapper reportMapper;
    private final FavoriteMapper favoriteMapper;
    private final FollowMapper followMapper;
    private final NotificationMapper notificationMapper;

    public Map<String, Object> dashboard() {
        Map<String, Object> result = new HashMap<>();

        // 1. 顶部指标卡片（总量）
        result.put("totals", totals());

        // 2. 最近 14 天趋势
        result.put("trend14d", trend14d());

        // 3. 待办指标（管理员需要立刻关注的）
        result.put("pending", pending());

        return result;
    }

    private Map<String, Object> totals() {
        Map<String, Object> t = new HashMap<>();
        t.put("users", countSafe(() -> userMapper.selectCount(null)));
        t.put("posts", countSafe(() -> postMapper.selectCount(
                new LambdaQueryWrapper<Post>().eq(Post::getStatus, 0))));
        t.put("comments", countSafe(() -> commentMapper.selectCount(
                new LambdaQueryWrapper<Comment>().eq(Comment::getStatus, 0))));
        t.put("reports", countSafe(() -> reportMapper.selectCount(null)));
        t.put("favorites", countSafe(() -> favoriteMapper.selectCount(null)));
        t.put("follows", countSafe(() -> followMapper.selectCount(null)));
        return t;
    }

    private Map<String, Object> pending() {
        Map<String, Object> p = new HashMap<>();
        p.put("pendingReports", countSafe(() -> reportMapper.selectCount(
                new LambdaQueryWrapper<Report>().eq(Report::getStatus, 0))));
        p.put("hiddenPosts", countSafe(() -> postMapper.selectCount(
                new LambdaQueryWrapper<Post>().eq(Post::getStatus, 1))));
        p.put("bannedUsers", countSafe(() -> userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getStatus, 1))));
        return p;
    }

    /** 最近 14 天的 [date, newPosts, newUsers, newComments, newReports] 序列 */
    private Map<String, Object> trend14d() {
        LocalDate today = LocalDate.now();
        List<String> dates = new ArrayList<>();
        List<Long> newPosts = new ArrayList<>();
        List<Long> newUsers = new ArrayList<>();
        List<Long> newComments = new ArrayList<>();
        List<Long> newReports = new ArrayList<>();

        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            LocalDateTime start = d.atStartOfDay();
            LocalDateTime end = d.plusDays(1).atStartOfDay();
            dates.add(d.toString());
            newPosts.add(countSafe(() -> postMapper.selectCount(
                    new LambdaQueryWrapper<Post>().ge(Post::getCreatedAt, start).lt(Post::getCreatedAt, end))));
            newUsers.add(countSafe(() -> userMapper.selectCount(
                    new LambdaQueryWrapper<User>().ge(User::getCreatedAt, start).lt(User::getCreatedAt, end))));
            newComments.add(countSafe(() -> commentMapper.selectCount(
                    new LambdaQueryWrapper<Comment>().ge(Comment::getCreatedAt, start).lt(Comment::getCreatedAt, end))));
            newReports.add(countSafe(() -> reportMapper.selectCount(
                    new LambdaQueryWrapper<Report>().ge(Report::getCreatedAt, start).lt(Report::getCreatedAt, end))));
        }

        Map<String, Object> t = new HashMap<>();
        t.put("dates", dates);
        t.put("newPosts", newPosts);
        t.put("newUsers", newUsers);
        t.put("newComments", newComments);
        t.put("newReports", newReports);
        return t;
    }

    /** 数量统计兜底：异常或 null 时返回 0 */
    private long countSafe(java.util.function.Supplier<Long> supplier) {
        try {
            Long v = supplier.get();
            return v == null ? 0 : v;
        } catch (Exception e) {
            log.warn("Stats count failed: {}", e.getMessage());
            return 0;
        }
    }
}
