package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.dto.post.PostListVO;
import com.xxx.treehole.entity.Favorite;
import com.xxx.treehole.entity.Follow;
import com.xxx.treehole.entity.Notification;
import com.xxx.treehole.entity.Post;
import com.xxx.treehole.mapper.FavoriteMapper;
import com.xxx.treehole.mapper.FollowMapper;
import com.xxx.treehole.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 收藏与关注业务。
 * - 收藏：用户 × 帖子（toggle 语义，复用 likes 模式）
 * - 关注：用户 × 用户（toggle 语义，被关注时触发通知）
 * 收藏的帖子列表复用 PostService.toVO 展示，这里仅做关系查询。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteFollowService {

    private final FavoriteMapper favoriteMapper;
    private final FollowMapper followMapper;
    private final PostMapper postMapper;
    private final PostService postService;
    private final NotificationService notificationService;

    // ============================================================
    // 收藏
    // ============================================================

    public Map<String, Object> toggleFavorite(Long userId, Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null || post.getStatus() == null || post.getStatus() != 0) {
            throw new BusinessException(404, "帖子不存在");
        }
        Favorite existing = favoriteMapper.selectOne(
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId)
                        .eq(Favorite::getPostId, postId));
        boolean favorited;
        if (existing == null) {
            Favorite f = new Favorite();
            f.setUserId(userId);
            f.setPostId(postId);
            favoriteMapper.insert(f);
            favorited = true;
        } else {
            favoriteMapper.deleteById(existing.getId());
            favorited = false;
        }
        return Map.of("favorited", favorited);
    }

    /** 检查当前用户是否收藏了某帖（详情页/列表用） */
    public boolean isFavorited(Long userId, Long postId) {
        if (userId == null || postId == null) return false;
        Long c = favoriteMapper.selectCount(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getPostId, postId));
        return c != null && c > 0;
    }

    /** 我的收藏列表（复用 PostService.toVO 渲染） */
    public PostListVO myFavorites(Long userId, int page, int size) {
        // 先查 favorites 分页，按 created_at desc
        Page<Favorite> fp = favoriteMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId)
                        .orderByDesc(Favorite::getCreatedAt));
        List<Favorite> favs = fp.getRecords();
        if (favs.isEmpty()) {
            PostListVO vo = new PostListVO();
            vo.setTotal(0L);
            vo.setList(List.of());
            return vo;
        }
        List<Long> postIds = favs.stream().map(Favorite::getPostId).toList();
        List<Post> posts = postMapper.selectBatchIds(postIds);
        // 保持 favorites 的顺序（按收藏时间倒序）
        Map<Long, Post> postMap = new java.util.HashMap<>();
        for (Post p : posts) {
            if (p.getStatus() != null && p.getStatus() == 0) {
                postMap.put(p.getId(), p);
            }
        }
        PostListVO vo = new PostListVO();
        vo.setTotal(fp.getTotal());
        vo.setList(favs.stream()
                .map(Favorite::getPostId)
                .map(postMap::get)
                .filter(Objects::nonNull)
                .map(postService::toVO)
                .toList());
        return vo;
    }

    // ============================================================
    // 关注
    // ============================================================

    public Map<String, Object> toggleFollow(Long followerId, Long followeeId) {
        if (Objects.equals(followerId, followeeId)) {
            throw new BusinessException(400, "不能关注自己");
        }
        Follow existing = followMapper.selectOne(
                new LambdaQueryWrapper<Follow>()
                        .eq(Follow::getFollowerId, followerId)
                        .eq(Follow::getFolloweeId, followeeId));
        boolean following;
        if (existing == null) {
            Follow f = new Follow();
            f.setFollowerId(followerId);
            f.setFolloweeId(followeeId);
            followMapper.insert(f);
            following = true;
            // 通知被关注者
            notificationService.notify(followeeId, followerId, Notification.TYPE_FOLLOW, null, null);
        } else {
            followMapper.deleteById(existing.getId());
            following = false;
        }
        // 返回最新计数
        long followerCount = countFollowers(followeeId);
        long followingCount = countFollowing(followeeId);
        return Map.of(
                "following", following,
                "followerCount", followerCount,
                "followingCount", followingCount
        );
    }

    /** 检查当前用户是否关注了某人 */
    public boolean isFollowing(Long followerId, Long followeeId) {
        if (followerId == null || followeeId == null) return false;
        Long c = followMapper.selectCount(new LambdaQueryWrapper<Follow>()
                .eq(Follow::getFollowerId, followerId)
                .eq(Follow::getFolloweeId, followeeId));
        return c != null && c > 0;
    }

    public long countFollowers(Long userId) {
        Long c = followMapper.selectCount(new LambdaQueryWrapper<Follow>()
                .eq(Follow::getFolloweeId, userId));
        return c == null ? 0 : c;
    }

    public long countFollowing(Long userId) {
        Long c = followMapper.selectCount(new LambdaQueryWrapper<Follow>()
                .eq(Follow::getFollowerId, userId));
        return c == null ? 0 : c;
    }
}
