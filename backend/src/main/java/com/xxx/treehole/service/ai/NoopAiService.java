package com.xxx.treehole.service.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * 默认 Noop 实现：{@code ai.enabled} 未配置或为 false 时生效（matchIfMissing=true）。
 * 所有方法返回 null / 安全默认值，业务层据此走 fallback 文案或 fail-open。
 * <p>
 * 用于：本地无 Ollama 环境 / 单元测试 / CI 环境。
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "ai.enabled", havingValue = "false", matchIfMissing = true)
public class NoopAiService implements AiService {

    public NoopAiService() {
        log.info("AiService running in Noop mode (ai.enabled=false), all LLM calls will return null/fallback");
    }

    @Override
    public String dailyFortune(String zodiac, LocalDate date) {
        return null;
    }

    @Override
    public TarotDrawResult drawTarotCards(LocalDate birthDate, String zodiac, String question) {
        return null;
    }

    @Override
    public String interpretTarot(List<DrawnCard> cards, String question) {
        return null;
    }

    @Override
    public ModerationResult moderatePost(String content) {
        return null;
    }

    @Override
    public String warmReply(String content) {
        return null;
    }

    @Override
    public SummarizeResult summarize(String content) {
        return null;
    }

    @Override
    public float[] embed(String text) {
        return null;
    }

    @Override
    public String echoSummary(java.util.List<String> samples) {
        return null;
    }
}
