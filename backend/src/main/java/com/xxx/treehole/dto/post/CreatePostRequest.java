package com.xxx.treehole.dto.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 发帖请求。postType=1 时需带 tarotData（JSON 字符串）。
 * mood 可选，仅接受 calm/sad/anxious/warm/grateful 之一（用于心情热力图统计）。
 */
@Data
public class CreatePostRequest {

    @NotBlank
    @Size(max = 2000)
    private String content;

    private Boolean isAnonymous;

    private Integer postType;

    private String tarotData;

    /** 心情：calm/sad/anxious/warm/grateful（可空） */
    @Pattern(regexp = "^(calm|sad|anxious|warm|grateful)?$", message = "心情值非法")
    private String mood;
}
