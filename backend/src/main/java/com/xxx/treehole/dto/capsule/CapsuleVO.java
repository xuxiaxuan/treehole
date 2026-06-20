package com.xxx.treehole.dto.capsule;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 胶囊 VO（用户端）：作者查自己的胶囊列表用。
 * 注意：列表接口仅返回当前用户自己的胶囊，不对外公开未揭封的 content。
 * 已揭封的胶囊可看 content + postId（跳广场）。
 */
@Data
public class CapsuleVO {

    private Long id;
    private String content;
    private String mood;
    private Boolean isAnonymous;
    private LocalDateTime revealAt;
    private Boolean revealed;
    /** 揭封失败（违规等永久错误），不会重试 */
    private Boolean failed;
    private Long postId;
    private LocalDateTime createdAt;

    /** 距揭封剩余秒数（已揭封返回 0） */
    private Long remainingSeconds;
}
