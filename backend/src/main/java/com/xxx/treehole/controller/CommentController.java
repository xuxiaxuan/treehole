package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.comment.CommentListVO;
import com.xxx.treehole.dto.comment.CreateCommentRequest;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 评论接口：创建 / 列表 / 删除 / 点赞。
 * GET 公开（未登录可看），写操作需登录。
 */
@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /** 列出帖子的评论（2 级结构） */
    @GetMapping("/api/posts/{postId}/comments")
    public Result<CommentListVO> list(@PathVariable Long postId,
                                      @RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return Result.success(commentService.listByPost(postId, page, size));
    }

    /** 发表评论（登录） */
    @PostMapping("/api/posts/{postId}/comments")
    public Result<Map<String, Long>> create(@PathVariable Long postId,
                                            @Valid @RequestBody CreateCommentRequest req) {
        Long userId = SecurityUtils.currentUserId();
        Long id = commentService.create(postId, userId, req);
        return Result.success(Map.of("id", id));
    }

    /** 删除评论：作者软删自己 / 管理员软删任何 */
    @DeleteMapping("/api/comments/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUserId();
        boolean isAdmin = SecurityUtils.isAdmin();
        commentService.delete(id, userId, isAdmin);
        return Result.success();
    }

    /** 点赞 / 取消点赞（toggle） */
    @PostMapping("/api/comments/{id}/like")
    public Result<Map<String, Object>> like(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(commentService.toggleLike(id, userId));
    }
}
