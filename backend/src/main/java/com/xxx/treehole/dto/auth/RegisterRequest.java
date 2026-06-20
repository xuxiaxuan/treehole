package com.xxx.treehole.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 注册请求。
 * birthday 可选，用于 AI 塔罗抽牌；不填则塔罗页临时输入或不提供。
 */
@Data
public class RegisterRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, max = 32)
    private String password;

    @NotBlank
    @Size(max = 32)
    private String nickname;

    /** 生日（可选），用于 AI 塔罗抽牌 */
    @PastOrPresent(message = "生日不能是未来日期")
    private LocalDate birthday;
}
