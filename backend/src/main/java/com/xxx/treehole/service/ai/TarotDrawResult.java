package com.xxx.treehole.service.ai;

import java.util.List;

/**
 * AI 抽牌结果：3 张牌的 cardId + 正逆位。
 * 由 AiService.drawTarotCards 返回，业务层据此构造 DrawnCard 列表。
 * 解析失败或 LLM 不可用时返回 null，由业务层回退随机抽。
 */
public record TarotDrawResult(List<Item> cards) {

    public record Item(int cardId, boolean reversed) {
    }
}
