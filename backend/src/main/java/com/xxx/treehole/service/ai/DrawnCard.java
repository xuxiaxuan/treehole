package com.xxx.treehole.service.ai;

import com.xxx.treehole.dto.tarot.TarotCard;

/**
 * 抽到的一张塔罗牌：含正逆位信息。
 * 用于塔罗解读的 LLM 输入。
 */
public record DrawnCard(TarotCard card, boolean reversed) {
}
