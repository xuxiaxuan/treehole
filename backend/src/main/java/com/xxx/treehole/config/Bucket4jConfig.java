package com.xxx.treehole.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bucket4j 限流配置：基于 IP+路径 的本地内存桶。
 * v1 流量小，不需要 Redis 分布式限流（YAGNI）。
 */
@Configuration
public class Bucket4jConfig {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String key) {
        return cache.computeIfAbsent(key, k -> {
            // 桶容量 5，每分钟补充 5 个 token（即每分钟最多 5 次）
            Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1)));
            return Bucket.builder().addLimit(limit).build();
        });
    }
}
