package com.xxx.treehole.service;

import com.xxx.treehole.dto.fortune.DailyFortuneVO;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.UserMapper;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.ai.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 每日运势业务：
 * - 复用 AiService.dailyFortune；LLM 不可用时走 fallback 文案
 * - 当日同用户只生成一次，本地缓存（次日自动失效）
 * - 未填生日 → 走通用运势（zodiac=null）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FortuneService {

    private final AiService aiService;
    private final UserMapper userMapper;

    @Value("${ai.fallback.daily-fortune:今日适合放慢脚步，照顾自己的感受。}")
    private String fortuneFallback;

    /** key = userId + ":" + yyyy-MM-dd，value = 运势文案 */
    private final Map<String, String> dailyCache = new ConcurrentHashMap<>();

    public DailyFortuneVO today() {
        Long userId = SecurityUtils.currentUserId();
        User user = userMapper.selectById(userId);
        LocalDate today = LocalDate.now();
        String dateStr = today.toString();
        String zodiac = (user != null && user.getBirthday() != null)
                ? zodiacOf(user.getBirthday())
                : null;

        String cacheKey = userId + ":" + dateStr;
        String fortune = dailyCache.get(cacheKey);
        if (fortune == null) {
            fortune = aiService.dailyFortune(zodiac, today);
            if (fortune == null || fortune.isBlank()) {
                return DailyFortuneVO.ofFallback(zodiac, dateStr, fortuneFallback);
            }
            dailyCache.put(cacheKey, fortune);
        }
        return DailyFortuneVO.of(zodiac, dateStr, fortune);
    }

    /** 复用 TarotService 的星座算法（保持单一真相） */
    private static String zodiacOf(LocalDate date) {
        int m = date.getMonthValue();
        int d = date.getDayOfMonth();
        return switch (m) {
            case 1 -> d >= 20 ? "水瓶座" : "摩羯座";
            case 2 -> d >= 19 ? "双鱼座" : "水瓶座";
            case 3 -> d >= 21 ? "白羊座" : "双鱼座";
            case 4 -> d >= 20 ? "金牛座" : "白羊座";
            case 5 -> d >= 21 ? "双子座" : "金牛座";
            case 6 -> d >= 22 ? "巨蟹座" : "双子座";
            case 7 -> d >= 23 ? "狮子座" : "巨蟹座";
            case 8 -> d >= 23 ? "处女座" : "狮子座";
            case 9 -> d >= 23 ? "天秤座" : "处女座";
            case 10 -> d >= 24 ? "天蝎座" : "天秤座";
            case 11 -> d >= 23 ? "射手座" : "天蝎座";
            case 12 -> d >= 22 ? "摩羯座" : "射手座";
            default -> null;
        };
    }
}
