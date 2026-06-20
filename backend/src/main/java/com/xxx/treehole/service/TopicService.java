package com.xxx.treehole.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxx.treehole.dto.topic.TopicVO;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 每日话题业务：从 daily-topics.json 加载话题池，按日期 hash 选今日话题。
 * 同一天同一话题，所有用户看到一致；次日自动切换。
 */
@Slf4j
@Service
public class TopicService {

    private static final ObjectMapper OM = new ObjectMapper();
    private List<String[]> pool = List.of();  // [title, prompt] 数组的列表

    @PostConstruct
    public void init() throws IOException {
        try (InputStream is = new ClassPathResource("data/daily-topics.json").getInputStream()) {
            Map<String, Object> data = OM.readValue(is, Map.class);
            List<Map<String, String>> topics = (List<Map<String, String>>) data.get("topics");
            pool = topics.stream()
                    .map(t -> new String[]{t.get("title"), t.get("prompt")})
                    .toList();
            log.info("Loaded {} daily topics", pool.size());
        }
    }

    public TopicVO today() {
        return ofDate(LocalDate.now());
    }

    public TopicVO ofDate(LocalDate date) {
        if (pool.isEmpty()) {
            return TopicVO.of(date.toString(), "今天的树洞", "随便说说");
        }
        // 按日期 hash 选取，保证稳定（同一天总相同）
        int idx = Math.floorMod(date.toEpochDay(), pool.size());
        String[] t = pool.get(idx);
        return TopicVO.of(date.toString(), t[0], t[1]);
    }
}
