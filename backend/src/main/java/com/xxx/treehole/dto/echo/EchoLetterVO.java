package com.xxx.treehole.dto.echo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 共鸣信件 VO：
 * - 自己写的信：返回 mine=true，含 createdAt
 * - 他人的信：mine=false，**不返回 fromUserId/fromNickname**（匿名）
 * - 未揭信时（22:00 前）：mine=false 的信**不返回 content**
 */
@Data
public class EchoLetterVO {

    private Long id;
    private String content;
    private Boolean mine;
    private LocalDateTime createdAt;

    /** 揭信时间（前端展示倒计时用） */
    private LocalDateTime revealedAt;
    /** 是否已揭信 */
    private Boolean revealed;
}
