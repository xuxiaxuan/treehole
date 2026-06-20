package com.xxx.treehole.controller.admin;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理端评论接口：仅支持删除（status=2 软删）。
 * 列表复用用户端 GET /api/posts/{postId}/comments（管理员能看所有状态）。
 */
@RestController
@RequestMapping("/api/admin/comments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCommentController {

    private final CommentService commentService;

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long adminId = SecurityUtils.currentUserId();
        commentService.delete(id, adminId, true);
        return Result.success();
    }
}
