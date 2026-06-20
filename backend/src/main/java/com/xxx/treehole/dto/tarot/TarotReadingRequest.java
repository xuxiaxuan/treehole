package com.xxx.treehole.dto.tarot;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 塔罗解读请求。
 * cards：用户抽到的牌，含正逆位（cardId 对应 TarotCard.id）
 * question：用户提问，可空（走通用解读）
 */
@Data
public class TarotReadingRequest {

    @NotEmpty(message = "至少抽一张牌")
    @Size(max = 3, message = "最多三张牌")
    private List<Item> cards;

    @Size(max = 200, message = "问题最长 200 字")
    private String question;

    @Data
    public static class Item {
        private Integer cardId;
        private Boolean reversed;
    }
}
