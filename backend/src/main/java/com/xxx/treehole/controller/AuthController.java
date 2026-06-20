package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.auth.AuthResponse;
import com.xxx.treehole.dto.auth.ChangePasswordRequest;
import com.xxx.treehole.dto.auth.LoginRequest;
import com.xxx.treehole.dto.auth.RegisterRequest;
import com.xxx.treehole.dto.auth.UpdateProfileRequest;
import com.xxx.treehole.dto.auth.UserVO;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证接口：注册 / 登录 / 当前用户 / 个人资料。
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public Result<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return Result.success(authService.register(req));
    }

    @PostMapping("/login")
    public Result<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return Result.success(authService.login(req));
    }

    @GetMapping("/me")
    public Result<UserVO> me() {
        Long userId = SecurityUtils.currentUserId();
        User u = authService.getCurrentUser(userId);
        return Result.success(AuthService.toUserVO(u));
    }

    /**
     * 个人中心详情：含发帖数与收到点赞总数。
     */
    @GetMapping("/profile")
    public Result<UserVO> profileDetail() {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(authService.getProfileDetail(userId));
    }

    /**
     * 更新昵称与头像（emoji 字符串或图片 URL）。
     */
    @PutMapping("/profile")
    public Result<UserVO> updateProfile(@Valid @RequestBody UpdateProfileRequest req) {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(authService.updateProfile(userId, req));
    }

    /**
     * 修改密码。成功后前端主动 logout 跳登录页。
     */
    @PutMapping("/password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        Long userId = SecurityUtils.currentUserId();
        authService.changePassword(userId, req);
        return Result.success();
    }
}
