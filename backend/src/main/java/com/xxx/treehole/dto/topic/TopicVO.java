package com.xxx.treehole.dto.topic;

import lombok.Data;

/**
 * 每日话题响应。
 * date 为话题对应的日期（yyyy-MM-dd）；tag 是用于过滤相关帖子的关键词。
 */
@Data
public class TopicVO {

    private String date;
    private String title;
    private String prompt;
    /** 标签：用户发帖带 #今日话题 即可被关联；后端做 LIKE 匹配 */
    private String tag;

    public static TopicVO of(String date, String title, String prompt) {
        TopicVO vo = new TopicVO();
        vo.date = date;
        vo.title = title;
        vo.prompt = prompt;
        vo.tag = "#今日话题";
        return vo;
    }
}
