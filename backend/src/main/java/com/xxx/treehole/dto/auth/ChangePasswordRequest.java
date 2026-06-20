package com.xxx.treehole.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 修改密码请求。
 * 无状态 JWT 不强制失效，前端在成功后主动 logout。
 */
@Data
public class ChangePasswordRequest {

    @NotBlank
    @Size(min = 6, max = 32)
    private String oldPassword;

    @NotBlank
    @Size(min = 6, max = 32)
    private String newPassword;
}
