package com.xxx.treehole.config;

import com.xxx.treehole.common.RateLimitInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置：注册限流拦截器。
 * 限流范围：发帖 / 点赞 / 举报三类写操作 + AI 端点（塔罗解读、温暖回复）。
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns(
                        "/api/posts",
                        "/api/posts/**",
                        "/api/comments/**",
                        "/api/users/**",
                        "/api/reports",
                        "/api/stories/**",
                        "/api/tarot/reading",
                        "/api/tarot/draw"
                );
    }
}
