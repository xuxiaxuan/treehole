package com.xxx.treehole;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 树洞广场后端主启动类。
 * <p>
 * {@code @EnableScheduling} 开启定时任务，用于：
 * <ul>
 *   <li>时间胶囊：每 5 分钟扫描到时间的胶囊并揭封</li>
 *   <li>共鸣信号：每天凌晨聚类过去 24h 帖子</li>
 * </ul>
 */
@SpringBootApplication
@MapperScan("com.xxx.treehole.mapper")
@EnableScheduling
public class TreeholeApplication {

    public static void main(String[] args) {
        SpringApplication.run(TreeholeApplication.class, args);
    }
}
