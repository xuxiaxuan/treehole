package com.xxx.treehole.dto.story;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AppendSegmentRequest {

    @NotBlank(message = "续写内容不能为空")
    @Size(max = 200, message = "每次续写最长 200 字")
    private String content;

    private Boolean isAnonymous;
}
