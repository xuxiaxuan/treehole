package com.xxx.treehole.controller.admin;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.admin.AdminUserDetailVO;
import com.xxx.treehole.dto.post.PostListVO;
import com.xxx.treehole.service.admin.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 管理端用户接口。
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public Result<Map<String, Object>> list(@RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "20") int size,
                                            @RequestParam(required = false) Integer status,
                                            @RequestParam(required = false) String keyword) {
        return Result.success(adminUserService.listUsers(page, size, status, keyword));
    }

    /**
     * 用户详情：基础信息 + 统计 + 最近发帖预览。
     */
    @GetMapping("/{id}")
    public Result<AdminUserDetailVO> detail(@PathVariable Long id) {
        return Result.success(adminUserService.getUserDetail(id));
    }

    /**
     * 某用户发帖历史（分页）。
     */
    @GetMapping("/{id}/posts")
    public Result<PostListVO> userPosts(@PathVariable Long id,
                                        @RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        return Result.success(adminUserService.listUserPosts(id, page, size));
    }

    @PatchMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        adminUserService.updateUserStatus(id, body.get("status"));
        return Result.success();
    }

    @PatchMapping("/{id}/role")
    public Result<Void> updateRole(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        adminUserService.updateUserRole(id, body.get("role"));
        return Result.success();
    }
}
