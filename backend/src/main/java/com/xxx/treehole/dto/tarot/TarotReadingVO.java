package com.xxx.treehole.dto.tarot;

import lombok.Data;

/**
 * 塔罗解读响应。
 * fallback=true 表示 LLM 不可用，返回兜底文案。
 */
@Data
public class TarotReadingVO {

    private String reading;
    private boolean fallback;

    public static TarotReadingVO of(String reading) {
        TarotReadingVO vo = new TarotReadingVO();
        vo.reading = reading;
        vo.fallback = false;
        return vo;
    }

    public static TarotReadingVO ofFallback(String fallbackText) {
        TarotReadingVO vo = new TarotReadingVO();
        vo.reading = fallbackText;
        vo.fallback = true;
        return vo;
    }
}
