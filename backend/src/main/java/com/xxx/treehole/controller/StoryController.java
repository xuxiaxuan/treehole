package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.story.AppendSegmentRequest;
import com.xxx.treehole.dto.story.CreateStoryRequest;
import com.xxx.treehole.dto.story.StoryListVO;
import com.xxx.treehole.dto.story.StoryVO;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.StoryService;
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
 * 协作故事接口：GET 公开；写操作登录。
 */
@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;

    @GetMapping
    public Result<StoryListVO> list(@RequestParam(defaultValue = "1") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        return Result.success(storyService.list(page, size));
    }

    @GetMapping("/{id}")
    public Result<StoryVO> detail(@PathVariable Long id) {
        return Result.success(storyService.detail(id));
    }

    @PostMapping
    public Result<Map<String, Long>> create(@Valid @RequestBody CreateStoryRequest req) {
        Long userId = SecurityUtils.currentUserId();
        Long id = storyService.create(userId, req);
        return Result.success(Map.of("id", id));
    }

    @PostMapping("/{id}/segments")
    public Result<Map<String, Long>> appendSegment(@PathVariable Long id,
                                                   @Valid @RequestBody AppendSegmentRequest req) {
        Long userId = SecurityUtils.currentUserId();
        Long segId = storyService.appendSegment(id, userId, req);
        return Result.success(Map.of("id", segId));
    }

    @PostMapping("/{id}/finish")
    public Result<Void> finish(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUserId();
        storyService.finish(id, userId);
        return Result.success();
    }
}
