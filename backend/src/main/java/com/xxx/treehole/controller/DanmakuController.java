package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.danmaku.DanmakuVO;
import com.xxx.treehole.dto.danmaku.SendDanmakuRequest;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.DanmakuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 弹幕接口：GET 公开；POST 登录。
 * 短轮询版（前端 10s 拉一次新弹幕）。
 */
@RestController
@RequiredArgsConstructor
public class DanmakuController {

    private final DanmakuService danmakuService;

    @GetMapping("/api/posts/{postId}/danmaku")
    public Result<List<DanmakuVO>> list(@PathVariable Long postId,
                                        @RequestParam(defaultValue = "50") int limit) {
        return Result.success(danmakuService.listByPost(postId, limit));
    }

    @PostMapping("/api/posts/{postId}/danmaku")
    public Result<Map<String, Long>> send(@PathVariable Long postId,
                                          @Valid @RequestBody SendDanmakuRequest req) {
        Long userId = SecurityUtils.currentUserId();
        Long id = danmakuService.send(postId, userId, req);
        return Result.success(Map.of("id", id));
    }
}
