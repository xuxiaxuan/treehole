package com.xxx.treehole.dto.fortune;

import lombok.Data;

/**
 * 每日运势响应。
 * zodiac：用户星座（可空，未填生日时为 null）
 * date：日期字符串 yyyy-MM-dd
 * fortune：运势文案；fallback=true 时是兜底文案
 */
@Data
public class DailyFortuneVO {

    private String zodiac;
    private String date;
    private String fortune;
    private boolean fallback;

    public static DailyFortuneVO of(String zodiac, String date, String fortune) {
        DailyFortuneVO vo = new DailyFortuneVO();
        vo.zodiac = zodiac;
        vo.date = date;
        vo.fortune = fortune;
        vo.fallback = false;
        return vo;
    }

    public static DailyFortuneVO ofFallback(String zodiac, String date, String fallbackText) {
        DailyFortuneVO vo = new DailyFortuneVO();
        vo.zodiac = zodiac;
        vo.date = date;
        vo.fortune = fallbackText;
        vo.fallback = true;
        return vo;
    }
}
