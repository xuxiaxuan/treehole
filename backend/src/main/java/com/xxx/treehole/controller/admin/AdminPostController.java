package com.xxx.treehole.controller.admin;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.post.PostListVO;
import com.xxx.treehole.service.PostService;
import com.xxx.treehole.service.ai.SummarizeResult;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 管理端帖子接口。
 */
@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPostController {

    private final PostService postService;

    @GetMapping
    public Result<PostListVO> list(@RequestParam(defaultValue = "1") int page,
                                   @RequestParam(defaultValue = "20") int size,
                                   @RequestParam(required = false) Integer status,
                                   @RequestParam(required = false) String keyword) {
        return Result.success(postService.adminList(page, size, status, keyword));
    }

    @PatchMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        postService.updatePostStatus(id, body.get("status"));
        return Result.success();
    }

    /**
     * 生成 AI 摘要 + 标签，并缓存到 posts 表。
     * 不限流（管理员操作，YAGNI）。LLM 不可用时返回 503。
     */
    @PostMapping("/{id}/summary")
    public Result<SummarizeResult> summary(@PathVariable Long id) {
        return Result.success(postService.generateSummary(id));
    }
}
