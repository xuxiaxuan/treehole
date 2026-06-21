package com.xxx.treehole.config;

import com.xxx.treehole.common.RateLimitInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置：注册限流拦截器。
 * <p>
 * 限流策略：按 IP+URI 维度，每分钟 5 次（GET 放行，仅限写操作）。
 * 覆盖范围：
 * <ul>
 *   <li>核心写：发帖/点赞/评论/举报/故事</li>
 *   <li>创新功能：花园日记/浇水/移植、时间胶囊、共鸣写信</li>
 *   <li>互动：弹幕（在 /api/posts/** 内）、收藏、关注</li>
 *   <li>防爆破：注册/登录</li>
 *   <li>AI：塔罗解读/抽牌（成本高）</li>
 * </ul>
 * <p>
 * 通过 app.ratelimit.enabled 开关，测试环境关闭避免 bucket 跨测试累计。
 */
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.ratelimit.enabled", havingValue = "true", matchIfMissing = true)
public class WebMvcConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns(
                        // 核心写操作
                        "/api/posts",
                        "/api/posts/**",
                        "/api/comments/**",
                        "/api/reports",
                        "/api/stories/**",
                        // 创新功能
                        "/api/garden/**",
                        "/api/capsules/**",
                        "/api/echo/**/letters",
                        // 互动
                        "/api/favorites/**",
                        "/api/follows/**",
                        // 防爆破
                        "/api/auth/register",
                        "/api/auth/login",
                        // AI（成本高，单独限流）
                        "/api/tarot/reading",
                        "/api/tarot/draw"
                );
    }
}
