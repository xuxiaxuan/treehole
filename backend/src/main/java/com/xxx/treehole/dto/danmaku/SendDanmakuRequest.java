package com.xxx.treehole.dto.danmaku;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendDanmakuRequest {

    @NotBlank(message = "弹幕内容不能为空")
    @Size(max = 30, message = "弹幕最长 30 字")
    private String content;

    /** hex 颜色，默认森林绿 */
    private String color;

    private Boolean isAnonymous;
}
