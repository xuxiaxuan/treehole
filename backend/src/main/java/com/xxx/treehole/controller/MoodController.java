package com.xxx.treehole.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xxx.treehole.common.Result;
import com.xxx.treehole.entity.Post;
import com.xxx.treehole.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 心情热力图接口：返回最近 30 天 × 5 种心情的帖子数矩阵。
 * 公开访问（聚合数据，无敏感信息）。
 *
 * 响应格式：
 * {
 *   "moods": ["calm","sad","anxious","warm","grateful"],
 *   "dates": ["2026-05-22", ...],
 *   "matrix": { "calm": [0, 1, 2, ...], "sad": [...], ... },
 *   "totals": { "calm": 10, "sad": 5, ... }
 * }
 */
@RestController
@RequestMapping("/api/moods")
@RequiredArgsConstructor
public class MoodController {

    private static final String[] MOODS = {"calm", "sad", "anxious", "warm", "grateful"};

    private final PostMapper postMapper;

    @GetMapping("/heatmap")
    public Result<Map<String, Object>> heatmap() {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(29);  // 含今天共 30 天

        LocalDateTime startDt = start.atStartOfDay();

        // 一次查全部 30 天 × 5 心情的数据
        List<Post> posts = postMapper.selectList(
                new LambdaQueryWrapper<Post>()
                        .eq(Post::getStatus, 0)
                        .isNotNull(Post::getMood)
                        .ne(Post::getMood, "")
                        .ge(Post::getCreatedAt, startDt));

        // 按 (mood, dateStr) 分桶
        Map<String, Map<String, Integer>> bucket = new LinkedHashMap<>();
        for (String m : MOODS) bucket.put(m, new HashMap<>());

        for (Post p : posts) {
            String m = p.getMood();
            if (m == null || !bucket.containsKey(m)) continue;
            String day = p.getCreatedAt().toLocalDate().toString();
            bucket.get(m).merge(day, 1, Integer::sum);
        }

        // 构造连续 30 天的日期数组 + 每种心情的 count 数组
        List<String> dates = new ArrayList<>();
        for (int i = 0; i < 30; i++) {
            dates.add(start.plusDays(i).toString());
        }

        Map<String, List<Integer>> matrix = new LinkedHashMap<>();
        Map<String, Integer> totals = new LinkedHashMap<>();
        for (String m : MOODS) {
            Map<String, Integer> dayMap = bucket.get(m);
            List<Integer> row = new ArrayList<>(30);
            int total = 0;
            for (String d : dates) {
                int c = dayMap.getOrDefault(d, 0);
                row.add(c);
                total += c;
            }
            matrix.put(m, row);
            totals.put(m, total);
        }

        return Result.success(Map.of(
                "moods", MOODS,
                "dates", dates,
                "matrix", matrix,
                "totals", totals
        ));
    }
}
