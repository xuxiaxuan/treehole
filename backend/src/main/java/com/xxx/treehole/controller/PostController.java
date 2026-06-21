package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.post.CreatePostRequest;
import com.xxx.treehole.dto.post.PostListVO;
import com.xxx.treehole.dto.post.PostVO;
import com.xxx.treehole.dto.post.WarmReplyVO;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 帖子接口：发帖 / 列表 / 详情 / 点赞。
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public Result<Map<String, Long>> create(@Valid @RequestBody CreatePostRequest req) {
        Long userId = SecurityUtils.currentUserId();
        Long id = postService.create(userId, req);
        return Result.success(Map.of("id", id));
    }

    @GetMapping
    public Result<PostListVO> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer type,
            @RequestParam(defaultValue = "new") String sort,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) Boolean anonymous) {
        return Result.success(postService.list(page, size, type, sort, mood, anonymous));
    }

    /** 搜索：按 content 关键词模糊匹配 */
    @GetMapping("/search")
    public Result<PostListVO> search(
            @RequestParam(name = "q", defaultValue = "") String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer type) {
        if (q == null || q.trim().isEmpty()) {
            return Result.success(postService.list(page, size, type, "new", null, null));
        }
        return Result.success(postService.search(q.trim(), page, size, type));
    }

    @GetMapping("/{id}")
    public Result<PostVO> detail(@PathVariable Long id) {
        return Result.success(postService.detail(id));
    }

    @PostMapping("/{id}/like")
    public Result<Map<String, Object>> like(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(postService.toggleLike(userId, id));
    }

    /**
     * 生成温暖回复：登录可用，限流 5/分钟/IP。
     * LLM 不可用时返回 fallback 文案，fallback=true。
     */
    @PostMapping("/{id}/warm-reply")
    public Result<WarmReplyVO> warmReply(@PathVariable Long id) {
        SecurityUtils.currentUserId(); // 仅校验登录
        return Result.success(postService.generateWarmReply(id));
    }
}
