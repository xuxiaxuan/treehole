package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.garden.CreateGardenNoteRequest;
import com.xxx.treehole.dto.garden.GardenNoteVO;
import com.xxx.treehole.dto.garden.GardenVO;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.GardenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 心情花园接口（V2 改造版）：**完全私密**，仅作者本人能访问。
 * <p>
 * 路由：
 * <ul>
 *   <li>GET   /api/garden               → 自己的花园视图（含植物网格）</li>
 *   <li>GET   /api/garden/notes         → 自己的日记列表</li>
 *   <li>GET   /api/garden/notes/{id}    → 单条日记详情</li>
 *   <li>POST  /api/garden/notes         → 种下新种子</li>
 *   <li>PATCH /api/garden/notes/{id}/water       → 浇水（每天一次）</li>
 *   <li>PATCH /api/garden/notes/{id}/transplant  → 移植到广场</li>
 *   <li>DELETE /api/garden/notes/{id}    → 删除日记</li>
 * </ul>
 * 全部需要登录，Service 层强制 user-id 一致。
 */
@RestController
@RequestMapping("/api/garden")
@RequiredArgsConstructor
public class GardenController {

    private final GardenService gardenService;

    /** 花园视图：植物网格 + 统计（仅自己） */
    @GetMapping
    public Result<GardenVO> myGarden() {
        SecurityUtils.currentUserId();
        return Result.success(gardenService.myGarden());
    }

    /** 自己的日记列表 */
    @GetMapping("/notes")
    public Result<List<GardenNoteVO>> listNotes() {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(gardenService.listNotes(userId));
    }

    /** 单条详情 */
    @GetMapping("/notes/{id}")
    public Result<GardenNoteVO> detail(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(gardenService.noteDetail(userId, id));
    }

    /** 种下新种子 */
    @PostMapping("/notes")
    public Result<Map<String, Long>> create(@Valid @RequestBody CreateGardenNoteRequest req) {
        Long userId = SecurityUtils.currentUserId();
        Long id = gardenService.createNote(userId, req);
        return Result.success(Map.of("id", id));
    }

    /** 浇水 */
    @PatchMapping("/notes/{id}/water")
    public Result<GardenNoteVO> water(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(gardenService.water(userId, id));
    }

    /**
     * 移植到广场：把私人日记转成 Post。
     * @param anonymous 是否匿名发到广场
     */
    @PatchMapping("/notes/{id}/transplant")
    public Result<Map<String, Long>> transplant(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean anonymous) {
        Long userId = SecurityUtils.currentUserId();
        Long postId = gardenService.transplant(userId, id, anonymous);
        return Result.success(Map.of("postId", postId));
    }

    /** 删除日记（不影响已移植到广场的 post） */
    @DeleteMapping("/notes/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUserId();
        gardenService.deleteNote(userId, id);
        return Result.success(null);
    }
}
