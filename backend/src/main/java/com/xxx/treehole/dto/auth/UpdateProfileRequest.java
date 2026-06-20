package com.xxx.treehole.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 更新个人资料请求。
 * avatarUrl 字段复用 users.avatar_url（VARCHAR 256），
 * 可存放 emoji 字符串（森林系头像）或图片 URL。
 * birthday 可选，传 null 表示不修改。
 */
@Data
public class UpdateProfileRequest {

    @NotBlank
    @Size(max = 32)
    private String nickname;

    @Size(max = 256)
    private String avatarUrl;

    /** 生日（可选），传 null 表示不修改；用于 AI 塔罗抽牌 */
    @PastOrPresent(message = "生日不能是未来日期")
    private LocalDate birthday;
}
