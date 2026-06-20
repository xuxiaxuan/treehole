package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.capsule.CapsuleVO;
import com.xxx.treehole.dto.capsule.CreateCapsuleRequest;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.TimeCapsuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 时间胶囊接口：仅登录用户可创建/查看自己的胶囊。
 * - POST /api/capsules       创建
 * - GET  /api/capsules       列表
 */
@RestController
@RequestMapping("/api/capsules")
@RequiredArgsConstructor
public class CapsuleController {

    private final TimeCapsuleService capsuleService;

    @PostMapping
    public Result<Map<String, Long>> create(@Valid @RequestBody CreateCapsuleRequest req) {
        Long userId = SecurityUtils.currentUserId();
        Long id = capsuleService.create(userId, req);
        return Result.success(Map.of("id", id));
    }

    @GetMapping
    public Result<List<CapsuleVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(capsuleService.listMine(userId, page, size));
    }
}
