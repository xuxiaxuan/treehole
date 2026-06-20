package com.xxx.treehole.dto.capsule;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 创建胶囊请求。
 * revealAt 必须晚于当前时间（@Future），且不超过 365 天（业务层校验，避免用户乱填 2099 年）。
 */
@Data
public class CreateCapsuleRequest {

    @NotBlank
    @Size(max = 2000)
    private String content;

    private Boolean isAnonymous;

    /** 心情标签（揭封后透传到 post） */
    @Pattern(regexp = "^(calm|sad|anxious|warm|grateful)?$", message = "心情值非法")
    private String mood;

    /** 揭封时间，必须晚于 now */
    @Future(message = "揭封时间必须晚于当前时间")
    private LocalDateTime revealAt;
}
