package com.xxx.treehole.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.dto.tarot.TarotCard;
import com.xxx.treehole.dto.tarot.TarotDrawRequest;
import com.xxx.treehole.dto.tarot.TarotDrawVO;
import com.xxx.treehole.dto.tarot.TarotReadingRequest;
import com.xxx.treehole.dto.tarot.TarotReadingVO;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.UserMapper;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.ai.AiService;
import com.xxx.treehole.service.ai.DrawnCard;
import com.xxx.treehole.service.ai.TarotDrawResult;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 塔罗牌业务：启动时加载 tarot.json 到内存；AI 抽牌 + AI 解读。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TarotService {

    private final AiService aiService;
    private final UserMapper userMapper;

    @Value("${ai.fallback.tarot-reading:牌面正在为你沉淀，稍后再来看看这份解读吧。}")
    private String tarotFallback;

    private List<TarotCard> allCards = new ArrayList<>();

    @PostConstruct
    public void init() throws IOException {
        try (InputStream is = new ClassPathResource("data/tarot.json").getInputStream()) {
            ObjectMapper om = new ObjectMapper();
            Map<String, List<TarotCard>> data = om.readValue(is, new TypeReference<>() {});
            allCards.addAll(data.getOrDefault("major", List.of()));
            allCards.addAll(data.getOrDefault("minor", List.of()));
            log.info("Loaded {} tarot cards", allCards.size());
        }
    }

    public List<TarotCard> getDeck() {
        return allCards;
    }

    /**
     * AI 抽牌：登录用户优先用数据库里的生日，未登录或未填则用请求里的 birthDate。
     * LLM 不可用 / 输出非法 → 回退 Fisher-Yates 随机抽，aiGenerated=false。
     */
    public TarotDrawVO drawCards(TarotDrawRequest req) {
        // 1. 解析生日来源：登录用户数据库 > 请求体
        LocalDate birthDate = req.getBirthDate();
        try {
            Long userId = SecurityUtils.currentUserIdOrNull();
            if (userId != null && birthDate == null) {
                User u = userMapper.selectById(userId);
                if (u != null) {
                    birthDate = u.getBirthday();
                }
            }
        } catch (Exception e) {
            // 未登录场景：SecurityUtils 抛异常时忽略，继续用 req.birthDate
        }

        String zodiac = birthDate == null ? null : zodiacOf(birthDate);

        // 2. 调 LLM 抽牌
        TarotDrawResult aiResult = aiService.drawTarotCards(birthDate, zodiac, req.getQuestion());
        if (aiResult != null && aiResult.cards() != null && aiResult.cards().size() == 3
                && allCardsExist(aiResult.cards())) {
            List<TarotDrawVO.Item> items = aiResult.cards().stream()
                    .map(it -> {
                        TarotDrawVO.Item i = new TarotDrawVO.Item();
                        i.setCardId(it.cardId());
                        i.setReversed(it.reversed());
                        return i;
                    })
                    .toList();
            return TarotDrawVO.of(items, true);
        }

        // 3. 兜底：本地 Fisher-Yates 随机抽 3 张
        log.info("AI draw unavailable or invalid, fallback to random draw");
        List<TarotCard> shuffled = new ArrayList<>(allCards);
        Collections.shuffle(shuffled);
        List<TarotDrawVO.Item> items = new ArrayList<>();
        for (int i = 0; i < 3 && i < shuffled.size(); i++) {
            TarotCard c = shuffled.get(i);
            TarotDrawVO.Item it = new TarotDrawVO.Item();
            it.setCardId(c.getId());
            it.setReversed(Math.random() < 0.5);
            items.add(it);
        }
        return TarotDrawVO.of(items, false);
    }

    /**
     * 生成塔罗解读：cardId 解析为 TarotCard → 调 AiService。
     * LLM 不可用（返回 null/空）时返回兜底文案，fallback=true。
     * cardId 解析不到直接抛业务异常（用户传了非法 id）。
     */
    public TarotReadingVO generateReading(TarotReadingRequest req) {
        List<DrawnCard> drawn = new ArrayList<>();
        for (TarotReadingRequest.Item item : req.getCards()) {
            TarotCard card = allCards.stream()
                    .filter(c -> c.getId() != null && c.getId().equals(item.getCardId()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException(400, "未找到塔罗牌：id=" + item.getCardId()));
            boolean reversed = Boolean.TRUE.equals(item.getReversed());
            drawn.add(new DrawnCard(card, reversed));
        }
        String reading = aiService.interpretTarot(drawn, req.getQuestion());
        return reading == null || reading.isBlank()
                ? TarotReadingVO.ofFallback(tarotFallback)
                : TarotReadingVO.of(reading);
    }

    // ============================================================
    // 内部工具
    // ============================================================

    /** 校验 LLM 返回的 cardId 是否都存在于牌库 */
    private boolean allCardsExist(List<TarotDrawResult.Item> cards) {
        for (TarotDrawResult.Item it : cards) {
            boolean exists = allCards.stream().anyMatch(c -> c.getId() != null && c.getId() == it.cardId());
            if (!exists) return false;
        }
        return true;
    }

    /** 根据生日推星座（按月日区间匹配） */
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
