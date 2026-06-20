package com.xxx.treehole.dto.tarot;

import lombok.Data;

import java.util.List;

/**
 * AI 抽牌响应。
 * aiGenerated=true 表示由 LLM 选中；false 表示兜底随机抽（LLM 不可用或输出非法）。
 * cards 含 cardId（对应 TarotCard.id）与 reversed（正逆位）。
 */
@Data
public class TarotDrawVO {

    private List<Item> cards;
    private boolean aiGenerated;

    @Data
    public static class Item {
        private Integer cardId;
        private Boolean reversed;
    }

    public static TarotDrawVO of(List<Item> cards, boolean aiGenerated) {
        TarotDrawVO vo = new TarotDrawVO();
        vo.cards = cards;
        vo.aiGenerated = aiGenerated;
        return vo;
    }
}
