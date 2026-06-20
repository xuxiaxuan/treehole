package com.xxx.treehole.dto.post;

import lombok.Data;

/**
 * 树洞温暖回复响应。
 * fallback=true 表示 LLM 不可用，返回兜底文案。
 */
@Data
public class WarmReplyVO {

    private String reply;
    private boolean fallback;

    public static WarmReplyVO of(String reply) {
        WarmReplyVO vo = new WarmReplyVO();
        vo.reply = reply;
        vo.fallback = false;
        return vo;
    }

    public static WarmReplyVO ofFallback(String fallbackText) {
        WarmReplyVO vo = new WarmReplyVO();
        vo.reply = fallbackText;
        vo.fallback = true;
        return vo;
    }
}
