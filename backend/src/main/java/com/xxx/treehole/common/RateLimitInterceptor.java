package com.xxx.treehole.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxx.treehole.config.Bucket4jConfig;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;

/**
 * 限流拦截器：对写操作按 IP+URI 维度限流（5 次/分钟）。
 * 路径范围由 WebMvcConfig 注册时限定。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final Bucket4jConfig bucket4jConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) throws Exception {
        // GET / OPTIONS 放行（在 WebMvcConfig 中已限定路径，这里再按方法过滤一次更安全）
        String method = req.getMethod();
        if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        String ip = getClientIp(req);
        Bucket bucket = bucket4jConfig.resolveBucket(ip + ":" + req.getRequestURI());
        if (bucket.tryConsume(1)) {
            return true;
        }

        log.warn("Rate limit exceeded for {} on {}", ip, req.getRequestURI());
        resp.setStatus(HttpServletResponse.SC_OK);
        resp.setContentType("application/json;charset=UTF-8");
        resp.getWriter().write(objectMapper.writeValueAsString(
                Map.of("code", 429, "msg", "操作太频繁，请稍后再试", "data", "")));
        return false;
    }

    private String getClientIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) ip = req.getHeader("X-Real-IP");
        if (ip == null || ip.isEmpty()) ip = req.getRemoteAddr();
        return ip == null ? "unknown" : ip.split(",")[0].trim();
    }
}
