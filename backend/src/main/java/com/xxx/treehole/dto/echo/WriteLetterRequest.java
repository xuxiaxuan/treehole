package com.xxx.treehole.dto.echo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 写信请求：每用户每房间限 1 封，≤100 中文字符。
 */
@Data
public class WriteLetterRequest {

    @NotBlank
    @Size(max = 200)  // 中文字符 UTF-8 占 3 字节，200 字节 ≈ 66 字符；放宽到 200 保险
    private String content;
}
