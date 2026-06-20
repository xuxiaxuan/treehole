package com.xxx.treehole.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxx.treehole.dto.tarot.TarotCard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 基于 Spring AI + Ollama 的 AiService 实现。
 * 仅在 {@code ai.enabled=true} 时装配，否则走 {@link NoopAiService}。
 * <p>
 * 所有 LLM 异常（超时 / 解析失败 / Ollama 未启动）均在内部吞掉，
 * 返回 null 由业务层兜底；不外泄给用户。
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.enabled", havingValue = "true")
public class OllamaAiService implements AiService {

    /** 审核支持的违规类别集合；LLM 输出未命中则视为 safe（fail-open） */
    private static final Set<String> MODERATION_CATEGORIES =
            Set.of("politics", "porn", "violence", "ad", "spam", "safe");

    /** 抽牌 cardId 上限：大阿尔卡那 22 张（id 0-21），允许 LLM 只选大阿尔卡那以提升解读连贯性 */
    private static final int TAROT_CARD_ID_MAX = 77;

    /** 抽牌数量固定为 3（三牌阵：过去/现在/未来） */
    private static final int TAROT_DRAW_COUNT = 3;

    /** 提取首个 JSON 对象 {...}，丢弃前后 markdown/解释文字 */
    private static final Pattern JSON_OBJECT = Pattern.compile("\\{[\\s\\S]*\\}");

    private static final ObjectMapper JSON = new ObjectMapper();

    private final ChatModel chatModel;

    /**
     * 软依赖 EmbeddingModel：Spring AI 未配置 embedding 模型时仍能启动。
     * 共鸣信号功能在此情况下自动降级（不产生聚类）。
     */
    private final org.springframework.beans.factory.ObjectProvider<EmbeddingModel> embeddingModelProvider;

    /** 共鸣信号 embedding 模型：默认 nomic-embed-text，本地小且快 */
    @Value("${ai.embedding.model:nomic-embed-text}")
    private String embeddingModelName;

    @Value("${ai.timeout.tarot:30s}")
    private Duration tarotTimeout;

    @Value("${ai.timeout.moderation:10s}")
    private Duration moderationTimeout;

    @Value("${ai.timeout.warm-reply:20s}")
    private Duration warmReplyTimeout;

    @Value("${ai.timeout.summarize:30s}")
    private Duration summarizeTimeout;

    @Value("${ai.timeout.embedding:15s}")
    private Duration embeddingTimeout;

    @Value("${ai.timeout.echo-summary:20s}")
    private Duration echoSummaryTimeout;

    @Override
    public String dailyFortune(String zodiac, LocalDate date) {
        String user = "今日日期：" + date + "\n" +
                "星座：" + (zodiac == null ? "通用（未指定星座）" : zodiac) + "\n" +
                "请生成今日运势。";
        return callQuietly(FORTUNE_SYSTEM, user, tarotTimeout, Function.identity());
    }

    @Override
    public TarotDrawResult drawTarotCards(LocalDate birthDate, String zodiac, String question) {
        StringBuilder user = new StringBuilder();
        user.append("今日日期：").append(LocalDate.now()).append("\n");
        user.append("用户生日：").append(birthDate == null ? "（未提供）" : birthDate).append("\n");
        user.append("星座：").append(zodiac == null ? "（未知）" : zodiac).append("\n");
        user.append("问题：").append(question == null || question.isBlank() ? "（用户未提供具体问题，请做整体运势抽牌）" : question).append("\n");
        user.append("\n请输出 JSON。");
        return callQuietly(TAROT_DRAW_SYSTEM, user.toString(), tarotTimeout, OllamaAiService::parseDrawResult);
    }

    @Override
    public String interpretTarot(List<DrawnCard> cards, String question) {
        if (cards == null || cards.isEmpty()) {
            return null;
        }
        StringBuilder cardLines = new StringBuilder();
        for (DrawnCard dc : cards) {
            TarotCard c = dc.card();
            if (c == null) continue;
            String orientation = dc.reversed() ? "逆位" : "正位";
            String keywords = c.getKeywords() == null ? "" : String.join("、", c.getKeywords());
            cardLines.append("- ").append(c.getName())
                    .append("（").append(orientation).append("）")
                    .append(" - 关键词：").append(keywords).append("\n");
        }
        String user = "问题：" + (question == null || question.isBlank() ? "（用户未提供问题）" : question) + "\n" +
                "抽到的牌：\n" + cardLines + "请生成解读。";
        return callQuietly(TAROT_SYSTEM, user, tarotTimeout, Function.identity());
    }

    @Override
    public ModerationResult moderatePost(String content) {
        if (content == null || content.isBlank()) {
            return ModerationResult.safe();
        }
        return callQuietly(MODERATION_SYSTEM, "内容：" + content + "\n判断：", moderationTimeout, OllamaAiService::parseModeration);
    }

    @Override
    public String warmReply(String content) {
        if (content == null || content.isBlank()) {
            return null;
        }
        String user = "用户分享：" + content + "\n你的回复：";
        // 去掉模型可能自加的引号
        return callQuietly(WARM_REPLY_SYSTEM, user, warmReplyTimeout, OllamaAiService::stripQuotes);
    }

    @Override
    public SummarizeResult summarize(String content) {
        if (content == null || content.isBlank()) {
            return null;
        }
        return callQuietly(SUMMARIZE_SYSTEM, "帖子内容：" + content, summarizeTimeout, OllamaAiService::parseSummary);
    }

    @Override
    public float[] embed(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        EmbeddingModel model = embeddingModelProvider.getIfAvailable();
        if (model == null) {
            log.debug("EmbeddingModel unavailable, skip embed");
            return null;
        }
        try {
            List<Double> vecList = CompletableFuture
                    .supplyAsync(() -> {
                        // M1 API: embed(String) 用默认 model；显式指定通过 EmbeddingRequest + OllamaOptions
                        EmbeddingRequest req = new EmbeddingRequest(
                                java.util.List.of(text),
                                new OllamaOptions().withModel(embeddingModelName));
                        EmbeddingResponse resp = model.call(req);
                        if (resp == null || resp.getResults() == null || resp.getResults().isEmpty()) {
                            return null;
                        }
                        return resp.getResults().get(0).getOutput();
                    })
                    .orTimeout(embeddingTimeout.toSeconds(), TimeUnit.SECONDS)
                    .join();
            return toFloatArray(vecList);
        } catch (CompletionException e) {
            Throwable cause = e.getCause() == null ? e : e.getCause();
            log.warn("Embedding failed (text len={}): {}", text.length(), cause.toString());
            return null;
        }
    }

    /** List<Double> → float[]，避免装箱开销（聚类需要原生数组） */
    private static float[] toFloatArray(List<Double> src) {
        if (src == null || src.isEmpty()) return null;
        float[] out = new float[src.size()];
        for (int i = 0; i < src.size(); i++) {
            out[i] = src.get(i).floatValue();
        }
        return out;
    }

    @Override
    public String echoSummary(java.util.List<String> samples) {
        if (samples == null || samples.isEmpty()) {
            return null;
        }
        // 拼成多行，限制总长避免 prompt 爆掉
        String joined = samples.stream()
                .limit(20)
                .reduce("", (a, b) -> (a + "\n- " + truncate(b, 80)));
        return callQuietly(ECHO_SUMMARY_SYSTEM,
                "以下是用户们的树洞心声：\n" + joined + "\n\n请用 15 字以内概括共同主题：",
                echoSummaryTimeout,
                Function.identity());
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }

    // ============================================================
    // 内部工具
    // ============================================================

    /**
     * 包一层超时 + 异常吞掉。parser 在 supplyAsync 内部执行，
     * 因此 {@link IllegalStateException}（格式非法）也会被捕获并返回 null。
     * CompletableFuture.orTimeout 触发时抛 CompletionException，同样返回 null。
     */
    private <T> T callQuietly(String system, String user, Duration timeout, Function<String, T> parser) {
        try {
            return CompletableFuture
                    .supplyAsync(() -> {
                        String raw = doCall(system, user);
                        if (raw == null) {
                            return null;
                        }
                        return parser.apply(raw);
                    })
                    .orTimeout(timeout.toSeconds(), TimeUnit.SECONDS)
                    .join();
        } catch (CompletionException e) {
            Throwable cause = e.getCause() == null ? e : e.getCause();
            log.warn("LLM call failed (system prompt len={}): {}", system.length(), cause.toString());
            return null;
        }
    }

    /**
     * 真正调 LLM 的方法。protected 便于单测 override，避免 mock 链式 ChatModel API。
     */
    protected String doCall(String system, String user) {
        Prompt prompt = new Prompt(List.of(
                new SystemMessage(system),
                new UserMessage(user)
        ));
        ChatResponse response = chatModel.call(prompt);
        if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
            return null;
        }
        return response.getResult().getOutput().getContent();
    }

    /** 去除模型可能自加的引号前缀/后缀 */
    private static String stripQuotes(String reply) {
        return reply.trim().replaceAll("^「|」$", "").replaceAll("^\"|\"$", "");
    }

    /** 解析审核输出：期望格式 "类别|理由"，取首行 lowercase 匹配枚举 */
    private static ModerationResult parseModeration(String raw) {
        String firstLine = raw.trim().lines().findFirst().orElse("");
        int bar = firstLine.indexOf('|');
        String category = (bar >= 0 ? firstLine.substring(0, bar) : firstLine).trim().toLowerCase();
        String reason = bar >= 0 ? firstLine.substring(bar + 1).trim() : "";
        if (!MODERATION_CATEGORIES.contains(category)) {
            // 未知类别一律视为 safe（fail-open）
            return ModerationResult.safe();
        }
        if ("safe".equals(category)) {
            return ModerationResult.safe();
        }
        return ModerationResult.ofViolation(category, reason.isBlank() ? category : reason);
    }

    /** 解析摘要 + 标签输出：按行匹配 SUMMARY: / TAGS: 前缀，任一缺失视为失败 */
    private static SummarizeResult parseSummary(String raw) {
        String summary = null;
        List<String> tags = null;
        for (String line : raw.trim().lines().toList()) {
            String s = line.trim();
            if (s.toUpperCase().startsWith("SUMMARY:")) {
                summary = s.substring("SUMMARY:".length()).trim();
            } else if (s.toUpperCase().startsWith("TAGS:")) {
                String tagLine = s.substring("TAGS:".length()).trim();
                tags = Arrays.stream(tagLine.split("[,，]"))
                        .map(String::trim)
                        .filter(t -> !t.isEmpty())
                        .collect(Collectors.toList());
            }
        }
        if (summary == null || summary.isEmpty() || tags == null) {
            throw new IllegalStateException("Invalid summary output");
        }
        return new SummarizeResult(summary, tags);
    }

    /**
     * 解析 LLM 抽牌输出：严格 JSON，校验 cardId 范围 + 不重复 + 数量=3。
     * 任一不满足抛 IllegalStateException，由 callQuietly 吞掉返回 null。
     */
    private static TarotDrawResult parseDrawResult(String raw) {
        Matcher m = JSON_OBJECT.matcher(raw);
        if (!m.find()) {
            throw new IllegalStateException("No JSON object in draw output");
        }
        JsonNode root;
        try {
            root = JSON.readTree(m.group());
        } catch (Exception e) {
            throw new IllegalStateException("Invalid JSON in draw output", e);
        }
        JsonNode arr = root.get("cards");
        if (arr == null || !arr.isArray() || arr.size() != TAROT_DRAW_COUNT) {
            throw new IllegalStateException("cards must be an array of " + TAROT_DRAW_COUNT);
        }
        List<TarotDrawResult.Item> items = new ArrayList<>();
        Set<Integer> seenIds = new HashSet<>();
        for (JsonNode el : arr) {
            JsonNode idNode = el.get("cardId");
            JsonNode revNode = el.get("reversed");
            if (idNode == null || !idNode.isInt()) {
                throw new IllegalStateException("cardId missing or not int");
            }
            int id = idNode.asInt();
            if (id < 0 || id > TAROT_CARD_ID_MAX || !seenIds.add(id)) {
                throw new IllegalStateException("cardId out of range or duplicate: " + id);
            }
            boolean reversed = revNode != null && revNode.asBoolean(false);
            items.add(new TarotDrawResult.Item(id, reversed));
        }
        return new TarotDrawResult(items);
    }

    // ============================================================
    // Prompt 模板（针对 qwen2.5:3b 中文小模型优化）
    // ============================================================

    /**
     * 抽牌 system prompt：强制 JSON 输出，严格约束 cardId 范围与数量。
     * 注意：小模型 JSON 稳定性差，仍可能输出 markdown 包裹或解释文字，parseDrawResult 会做兜底。
     */
    private static final String FORTUNE_SYSTEM =
            "你是每日运势占卜师。基于用户星座和今日日期，生成 60-120 字的中文运势文案。" +
            "要求：开头点明星座与日期；中间分「事业/感情/能量」三方面用 1 句话简评（用「- 」开头）；" +
            "结尾一句温暖建议；不加 emoji、不输出额外说明。";

    private static final String TAROT_DRAW_SYSTEM =
            "你是塔罗抽牌师。根据用户的星座、生日、今日日期和问题，从 78 张塔罗牌中选出 3 张。" +
            "cardId 范围 0-77（0-21 大阿尔卡那，22+ 小阿尔卡那）。" +
            "要求：" +
            "1. 基于牌意与用户处境匹配，不要只挑好牌；" +
            "2. 必须输出恰好 3 张，cardId 不能重复；" +
            "3. reversed 字段表示逆位（true=逆位，false=正位）；" +
            "4. 只输出 JSON，不要 markdown 代码块、不要解释、不要任何额外文字。" +
            "输出格式（严格遵守）：\n" +
            "{\"cards\":[{\"cardId\":0,\"reversed\":false},{\"cardId\":1,\"reversed\":true},{\"cardId\":2,\"reversed\":false}]}";

    private static final String TAROT_SYSTEM =
            "你是塔罗解读师。基于抽到的牌（含正逆位）和用户问题，生成 150-250 字的中文解读。" +
            "要求：开头一句整体牌意；中间分牌解读用「- 」开头；结尾一句温暖建议；不输出额外说明、不加 emoji。";

    private static final String MODERATION_SYSTEM =
            "你是内容审核员。判断用户内容是否违规。" +
            "违规类别：politics(涉政), porn(色情), violence(暴力), ad(广告引流), spam(刷屏), safe(正常)。" +
            "只输出一行，格式：类别|理由（≤20字）";

    private static final String WARM_REPLY_SYSTEM =
            "你是温柔倾听者。用户在树洞分享心事，请生成 1-2 句共情回复（30-60 字）。" +
            "要求：不评价不说教；不建议具体行动；用\"你\"称呼；只输出回复本身不加引号前缀。";

    private static final String SUMMARIZE_SYSTEM =
            "生成帖子摘要和标签。" +
            "输出格式（严格遵守）：\n" +
            "SUMMARY: 不超过80字的中文摘要\n" +
            "TAGS: 1-3 个标签，逗号分隔，每个≤4字\n" +
            "只输出这两行，不加其他内容。";

    /**
     * 共鸣信号主题摘要：要求短、感性、不暴露具体词。
     * 例：「等待被理解的深夜」「对未来隐隐的期待」「对工作的疲惫」
     */
    private static final String ECHO_SUMMARY_SYSTEM =
            "你是共鸣信号分析员。给你多段匿名树洞心声，请用 15 字以内中文概括它们的共同主题。" +
            "要求：抽象但感性；不带具体名词；不带 emoji；只输出主题本身不加引号前缀。";
}
