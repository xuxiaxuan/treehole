package com.xxx.treehole.dto.auth;

import lombok.Data;

/**
 * 注册/登录响应：token + 用户信息。
 */
@Data
public class AuthResponse {

    private String token;
    private UserVO user;
}
