package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.tarot.TarotCard;
import com.xxx.treehole.dto.tarot.TarotDrawRequest;
import com.xxx.treehole.dto.tarot.TarotDrawVO;
import com.xxx.treehole.dto.tarot.TarotReadingRequest;
import com.xxx.treehole.dto.tarot.TarotReadingVO;
import com.xxx.treehole.service.TarotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 塔罗接口：返回 78 张牌元数据 + AI 抽牌 + AI 解读。
 */
@RestController
@RequestMapping("/api/tarot")
@RequiredArgsConstructor
public class TarotController {

    private final TarotService tarotService;

    @GetMapping("/deck")
    public Result<Map<String, List<TarotCard>>> deck() {
        var all = tarotService.getDeck();
        var major = all.stream().filter(c -> c.getSuit() == null || "major".equals(c.getSuit())).toList();
        var minor = all.stream().filter(c -> c.getSuit() != null && !"major".equals(c.getSuit())).toList();
        return Result.success(Map.of("major", major, "minor", minor));
    }

    /**
     * AI 抽牌：公开接口（游客可玩），限流 5/分钟/IP。
     * 登录用户优先用数据库里的生日，未登录或未填则用请求里的 birthDate。
     * LLM 不可用 / 输出非法 → 自动回退随机抽，aiGenerated=false。
     */
    @PostMapping("/draw")
    public Result<TarotDrawVO> draw(@Valid @RequestBody TarotDrawRequest req) {
        return Result.success(tarotService.drawCards(req));
    }

    /**
     * 解读：公开接口（游客可玩），限流 5/分钟/IP（在 WebMvcConfig 配置）。
     * LLM 不可用时返回 fallback 文案，fallback=true。
     */
    @PostMapping("/reading")
    public Result<TarotReadingVO> reading(@Valid @RequestBody TarotReadingRequest req) {
        return Result.success(tarotService.generateReading(req));
    }
}
