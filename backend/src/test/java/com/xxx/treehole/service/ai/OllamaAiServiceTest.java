package com.xxx.treehole.service.ai;

import com.xxx.treehole.dto.tarot.TarotCard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

/**
 * OllamaAiService 单测：通过子类覆盖 doCall 注入桩响应，避免 mock 链式 ChatModel API。
 * 覆盖：塔罗解读 / 审核（含 fail-open 与格式解析）/ 温暖回复 / 摘要（含失败）。
 */
class OllamaAiServiceTest {

    private StubOllamaAiService service;

    @BeforeEach
    void setUp() {
        service = new StubOllamaAiService();
        // 补齐 @Value 注入的超时字段，使用短超时加速测试
        ReflectionTestUtils.setField(service, "tarotTimeout", Duration.ofSeconds(2));
        ReflectionTestUtils.setField(service, "moderationTimeout", Duration.ofSeconds(2));
        ReflectionTestUtils.setField(service, "warmReplyTimeout", Duration.ofSeconds(2));
        ReflectionTestUtils.setField(service, "summarizeTimeout", Duration.ofSeconds(2));
    }

    // ============================================================
    // 塔罗抽牌（AI draw）
    // ============================================================

    @Test
    void drawTarotCards_parsesStrictJsonWithMarkdownWrap() {
        // qwen2.5:3b 经常用 ```json ... ``` 包裹输出
        service.nextResponse = "```json\n{\"cards\":[{\"cardId\":0,\"reversed\":false},{\"cardId\":5,\"reversed\":true},{\"cardId\":12,\"reversed\":false}]}\n```";
        TarotDrawResult r = service.drawTarotCards(LocalDate.of(1995, 5, 10), "金牛座", "我最近事业怎么样？");
        assertNotNull(r);
        assertEquals(3, r.cards().size());
        assertEquals(0, r.cards().get(0).cardId());
        assertFalse(r.cards().get(0).reversed());
        assertTrue(r.cards().get(1).reversed());
        assertEquals(12, r.cards().get(2).cardId());
    }

    @Test
    void drawTarotCards_returnsNullWhenDuplicateIds() {
        service.nextResponse = "{\"cards\":[{\"cardId\":0,\"reversed\":false},{\"cardId\":0,\"reversed\":true},{\"cardId\":1,\"reversed\":false}]}";
        TarotDrawResult r = service.drawTarotCards(null, null, null);
        assertNull(r, "重复 cardId 视为非法，返回 null");
    }

    @Test
    void drawTarotCards_returnsNullWhenCardIdOutOfRange() {
        service.nextResponse = "{\"cards\":[{\"cardId\":99,\"reversed\":false},{\"cardId\":0,\"reversed\":true},{\"cardId\":1,\"reversed\":false}]}";
        assertNull(service.drawTarotCards(null, null, null));
    }

    @Test
    void drawTarotCards_returnsNullWhenWrongCount() {
        service.nextResponse = "{\"cards\":[{\"cardId\":0,\"reversed\":false}]}";  // 只有 1 张
        assertNull(service.drawTarotCards(null, null, null));
    }

    @Test
    void drawTarotCards_returnsNullWhenNoJson() {
        service.nextResponse = "抱歉，我无法完成这个任务。";
        assertNull(service.drawTarotCards(null, null, null));
    }

    @Test
    void drawTarotCards_returnsNullWhenCallFails() {
        service.nextException = new RuntimeException("ollama down");
        assertNull(service.drawTarotCards(LocalDate.of(1990, 1, 1), "摩羯座", "test"));
    }

    @Test
    void drawTarotCards_acceptsMissingReversedField() {
        // reversed 缺失时默认 false（正位）
        service.nextResponse = "{\"cards\":[{\"cardId\":0},{\"cardId\":1},{\"cardId\":2}]}";
        TarotDrawResult r = service.drawTarotCards(null, null, null);
        assertNotNull(r);
        assertEquals(3, r.cards().size());
        assertFalse(r.cards().get(0).reversed());
    }

    // ============================================================
    // 塔罗解读
    // ============================================================

    @Test
    void interpretTarot_returnsContentOnSuccess() {
        service.nextResponse = "整体牌意良好。\n- 愚者：新的开始\n建议：勇敢前行。";
        TarotCard card = newCard(0, "愚者", List.of("开始", "纯真"));
        String result = service.interpretTarot(List.of(new DrawnCard(card, false)), "事业如何？");
        assertNotNull(result);
        assertTrue(result.contains("整体牌意"));
    }

    @Test
    void interpretTarot_returnsNullWhenException() {
        service.nextException = new RuntimeException("ollama down");
        TarotCard card = newCard(1, "魔术师", List.of("创造"));
        String result = service.interpretTarot(List.of(new DrawnCard(card, true)), null);
        assertNull(result); // 业务层据此走 fallback
    }

    @Test
    void interpretTarot_returnsNullForEmptyInput() {
        assertNull(service.interpretTarot(null, "q"));
        assertNull(service.interpretTarot(List.of(), "q"));
    }

    // ============================================================
    // 审核
    // ============================================================

    @Test
    void moderatePost_returnsSafeForSafeCategory() {
        service.nextResponse = "safe|正常";
        ModerationResult mr = service.moderatePost("今天天气不错");
        assertNotNull(mr);
        assertTrue(mr.pass());
        assertEquals("safe", mr.category());
    }

    @Test
    void moderatePost_flagsViolation() {
        service.nextResponse = "ad|推广微信号引流";
        ModerationResult mr = service.moderatePost("加我微信买产品");
        assertNotNull(mr);
        assertFalse(mr.pass());
        assertEquals("ad", mr.category());
    }

    @Test
    void moderatePost_unknownCategoryFallsOpenAsSafe() {
        service.nextResponse = "xyz123|乱七八糟";
        ModerationResult mr = service.moderatePost("一些内容");
        assertNotNull(mr);
        assertTrue(mr.pass(), "未知类别应 fail-open 视为 safe");
    }

    @Test
    void moderatePost_returnsNullWhenCallFails() {
        service.nextException = new RuntimeException("timeout");
        ModerationResult mr = service.moderatePost("some content");
        assertNull(mr, "LLM 失败时返回 null 由业务层 fail-open");
    }

    @Test
    void moderatePost_emptyContentReturnsSafeWithoutCalling() {
        ModerationResult mr = service.moderatePost("");
        assertNotNull(mr);
        assertTrue(mr.pass());
        assertEquals(0, service.callCount, "空内容不应触发 LLM 调用");
    }

    // ============================================================
    // 温暖回复
    // ============================================================

    @Test
    void warmReply_stripsQuotes() {
        service.nextResponse = "\"我听到你了\"";
        String reply = service.warmReply("今天好难过");
        assertEquals("我听到你了", reply);
    }

    @Test
    void warmReply_stripsChineseQuotes() {
        service.nextResponse = "「我听到你了」";
        String reply = service.warmReply("今天好难过");
        assertEquals("我听到你了", reply);
    }

    @Test
    void warmReply_returnsNullOnFailure() {
        service.nextException = new RuntimeException("connection refused");
        assertNull(service.warmReply("今天好难过"));
    }

    // ============================================================
    // 摘要
    // ============================================================

    @Test
    void summarize_parsesSummaryAndTags() {
        service.nextResponse = "SUMMARY: 关于今天心情的一段记录\nTAGS: 心情,日常,随笔";
        SummarizeResult result = service.summarize("今天阳光很好，我去了公园散步。");
        assertNotNull(result);
        assertEquals("关于今天心情的一段记录", result.summary());
        assertEquals(3, result.tags().size());
        assertEquals("心情", result.tags().get(0));
    }

    @Test
    void summarize_parsesChineseCommaInTags() {
        service.nextResponse = "SUMMARY: 简短摘要\nTAGS: 心情，日常";
        SummarizeResult result = service.summarize("内容");
        assertNotNull(result);
        assertEquals(List.of("心情", "日常"), result.tags());
    }

    @Test
    void summarize_returnsNullWhenFormatInvalid() {
        service.nextResponse = "只有一行普通文本，没有 SUMMARY/TAGS 前缀";
        assertNull(service.summarize("内容"));
    }

    @Test
    void summarize_returnsNullWhenTagsMissing() {
        service.nextResponse = "SUMMARY: 摘要内容"; // 缺 TAGS
        assertNull(service.summarize("内容"));
    }

    @Test
    void summarize_returnsNullOnException() {
        service.nextException = new RuntimeException("timeout");
        assertNull(service.summarize("内容"));
    }

    // ============================================================
    // 辅助
    // ============================================================

    private TarotCard newCard(int id, String name, List<String> keywords) {
        TarotCard c = new TarotCard();
        c.setId(id);
        c.setName(name);
        c.setKeywords(keywords);
        return c;
    }

    /**
     * 子类覆盖 doCall，注入测试桩响应或异常。
     * chatModel 不参与测试，构造传 null 即可。
     */
    static class StubOllamaAiService extends OllamaAiService {
        String nextResponse;
        RuntimeException nextException;
        int callCount;

        // 显式无参构造：父类有 @RequiredArgsConstructor，需要传 ChatModel + EmbeddingModel Provider
        // ObjectProvider 不是 functional interface，必须 mock
        @SuppressWarnings("unchecked")
        StubOllamaAiService() {
            super(null, (ObjectProvider<EmbeddingModel>) mock(ObjectProvider.class));
        }

        @Override
        protected String doCall(String system, String user) {
            callCount++;
            if (nextException != null) {
                throw nextException;
            }
            return nextResponse;
        }
    }
}
