package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.post.PostListVO;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.FavoriteFollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 收藏与关注接口：登录可用。
 * toggle 语义（已存在则取消）。
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FavoriteFollowController {

    private final FavoriteFollowService ffService;

    // ============================================================
    // 收藏
    // ============================================================

    /** 切换收藏状态 */
    @PostMapping("/posts/{id}/favorite")
    public Result<Map<String, Object>> toggleFavorite(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(ffService.toggleFavorite(userId, id));
    }

    /** 我的收藏列表 */
    @GetMapping("/me/favorites")
    public Result<PostListVO> myFavorites(@RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(ffService.myFavorites(userId, page, size));
    }

    // ============================================================
    // 关注
    // ============================================================

    /** 切换关注状态 */
    @PostMapping("/users/{id}/follow")
    public Result<Map<String, Object>> toggleFollow(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(ffService.toggleFollow(userId, id));
    }

    /** 查询某用户的关注/粉丝数 + 当前用户是否关注他 */
    @GetMapping("/users/{id}/follow-info")
    public Result<Map<String, Object>> followInfo(@PathVariable Long id) {
        Long curUserId = SecurityUtils.currentUserIdOrNull();
        long followerCount = ffService.countFollowers(id);
        long followingCount = ffService.countFollowing(id);
        boolean following = ffService.isFollowing(curUserId, id);
        return Result.success(Map.of(
                "followerCount", followerCount,
                "followingCount", followingCount,
                "following", following,
                "isMe", curUserId != null && curUserId.equals(id)
        ));
    }
}
