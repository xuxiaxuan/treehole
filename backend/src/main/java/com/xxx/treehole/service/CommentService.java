package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.dto.comment.CommentListVO;
import com.xxx.treehole.dto.comment.CommentVO;
import com.xxx.treehole.dto.comment.CreateCommentRequest;
import com.xxx.treehole.entity.Comment;
import com.xxx.treehole.entity.CommentLike;
import com.xxx.treehole.entity.Notification;
import com.xxx.treehole.entity.Post;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.CommentLikeMapper;
import com.xxx.treehole.mapper.CommentMapper;
import com.xxx.treehole.mapper.PostMapper;
import com.xxx.treehole.mapper.UserMapper;
import com.xxx.treehole.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 评论业务：发表 / 列表（2 级嵌套）/ 删除 / 点赞。
 * 软删：status=1 用户删 / 2 管理员删，content 显示占位文案。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private static final String DELETED_PLACEHOLDER = "该评论已删除";

    private final CommentMapper commentMapper;
    private final CommentLikeMapper commentLikeMapper;
    private final PostMapper postMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    /** 创建评论 */
    public Long create(Long postId, Long userId, CreateCommentRequest req) {
        // 校验帖子存在且未删除
        Post post = postMapper.selectById(postId);
        if (post == null || post.getStatus() == null || post.getStatus() != 0) {
            throw new BusinessException(404, "帖子不存在");
        }
        // 校验 parentId（如果给了）属于同一帖子
        if (req.getParentId() != null) {
            Comment parent = commentMapper.selectById(req.getParentId());
            if (parent == null || !Objects.equals(parent.getPostId(), postId)) {
                throw new BusinessException(400, "父评论不存在或不属于该帖子");
            }
        }

        Comment c = new Comment();
        c.setPostId(postId);
        c.setUserId(userId);
        c.setParentId(req.getParentId());
        c.setReplyToUserId(req.getReplyToUserId());
        c.setContent(req.getContent());
        c.setIsAnonymous(Boolean.TRUE.equals(req.getIsAnonymous()) ? 1 : 0);
        c.setLikeCount(0);
        c.setStatus(0);
        commentMapper.insert(c);
        // 触发通知：
        // 1) parentId=null（一级评论）→ 通知帖子作者
        // 2) parentId!=null（回复）→ 通知父评论作者；同时若 replyToUserId 不同，也通知 replyTo 用户
        if (req.getParentId() == null) {
            notificationService.notify(post.getUserId(), userId,
                    Notification.TYPE_COMMENT, postId, c.getId());
        } else {
            // 找父评论拿作者 id
            Comment parent = commentMapper.selectById(req.getParentId());
            if (parent != null && !java.util.Objects.equals(parent.getUserId(), userId)) {
                notificationService.notify(parent.getUserId(), userId,
                        Notification.TYPE_REPLY, postId, c.getId());
            }
            // @ 目标用户与父评论作者不同 → 再通知一次
            if (req.getReplyToUserId() != null
                    && !java.util.Objects.equals(req.getReplyToUserId(), userId)
                    && !java.util.Objects.equals(req.getReplyToUserId(), parent == null ? null : parent.getUserId())) {
                notificationService.notify(req.getReplyToUserId(), userId,
                        Notification.TYPE_REPLY, postId, c.getId());
            }
        }
        return c.getId();
    }

    /**
     * 帖子评论列表（2 级结构）。
     * 一级评论分页（按 createdAt 正序），每条一级评论的子回复一次性查出（最多 100 条，YAGNI）。
     */
    public CommentListVO listByPost(Long postId, int page, int size) {
        CommentListVO result = new CommentListVO();

        // 1. 查一级评论（parentId IS NULL）
        LambdaQueryWrapper<Comment> q = new LambdaQueryWrapper<Comment>()
                .eq(Comment::getPostId, postId)
                .isNull(Comment::getParentId)
                .orderByAsc(Comment::getCreatedAt);
        Page<Comment> p = commentMapper.selectPage(new Page<>(page, size), q);
        List<Comment> topLevel = p.getRecords();
        result.setTotal(p.getTotal());
        if (topLevel.isEmpty()) {
            result.setList(List.of());
            return result;
        }

        // 2. 查这些一级评论的所有子回复（按 parent_id 批量查）
        Set<Long> topIds = topLevel.stream().map(Comment::getId).collect(Collectors.toSet());
        List<Comment> children = commentMapper.selectList(new LambdaQueryWrapper<Comment>()
                .in(Comment::getParentId, topIds)
                .orderByAsc(Comment::getCreatedAt));

        // 3. 收集所有需要的 userId（作者 + @目标）批量查 User，避免 N+1
        Set<Long> userIds = new java.util.HashSet<>();
        topLevel.forEach(c -> userIds.add(c.getUserId()));
        children.forEach(c -> {
            userIds.add(c.getUserId());
            if (c.getReplyToUserId() != null) userIds.add(c.getReplyToUserId());
        });
        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            userMapper.selectBatchIds(userIds).forEach(u -> userMap.put(u.getId(), u));
        }

        // 4. 当前登录用户点赞状态（未登录则空）
        final Long curUserId = safeCurrentUserId();
        final boolean isAdmin = curUserId != null && SecurityUtils.isAdmin();
        final Set<Long> likedCommentIds = curUserId == null ? Set.of()
                : collectLikedIds(curUserId, topLevel, children);

        // 5. 组装 VO（按 parentId 分组 children）
        Map<Long, List<CommentVO>> childrenMap = new HashMap<>();
        for (Comment c : children) {
            childrenMap.computeIfAbsent(c.getParentId(), k -> new ArrayList<>())
                    .add(toVO(c, userMap, curUserId, isAdmin, likedCommentIds));
        }
        List<CommentVO> list = topLevel.stream()
                .map(c -> {
                    CommentVO vo = toVO(c, userMap, curUserId, isAdmin, likedCommentIds);
                    vo.setChildren(childrenMap.getOrDefault(c.getId(), List.of()));
                    return vo;
                })
                .toList();
        result.setList(list);
        return result;
    }

    /** 删除评论：作者软删 status=1，管理员软删 status=2 */
    public void delete(Long commentId, Long userId, boolean isAdmin) {
        Comment c = commentMapper.selectById(commentId);
        if (c == null) {
            throw new BusinessException(404, "评论不存在");
        }
        if (!isAdmin && !Objects.equals(c.getUserId(), userId)) {
            throw new BusinessException(403, "只能删除自己的评论");
        }
        c.setStatus(isAdmin ? 2 : 1);
        commentMapper.updateById(c);
    }

    /** 点赞 / 取消点赞（toggle） */
    @Transactional
    public Map<String, Object> toggleLike(Long commentId, Long userId) {
        Comment c = commentMapper.selectById(commentId);
        if (c == null || (c.getStatus() != null && c.getStatus() != 0)) {
            throw new BusinessException(404, "评论不存在");
        }
        CommentLike existing = commentLikeMapper.selectOne(
                new LambdaQueryWrapper<CommentLike>()
                        .eq(CommentLike::getUserId, userId)
                        .eq(CommentLike::getCommentId, commentId));
        boolean liked;
        if (existing == null) {
            CommentLike l = new CommentLike();
            l.setUserId(userId);
            l.setCommentId(commentId);
            commentLikeMapper.insert(l);
            c.setLikeCount((c.getLikeCount() == null ? 0 : c.getLikeCount()) + 1);
            liked = true;
        } else {
            commentLikeMapper.deleteById(existing.getId());
            c.setLikeCount(Math.max(0, (c.getLikeCount() == null ? 0 : c.getLikeCount()) - 1));
            liked = false;
        }
        commentMapper.updateById(c);
        return Map.of("liked", liked, "likeCount", c.getLikeCount());
    }

    // ============================================================
    // 内部工具
    // ============================================================

    /** Entity -> VO；处理匿名 + 软删 + canDelete */
    private CommentVO toVO(Comment c, Map<Long, User> userMap,
                           Long curUserId, boolean isAdmin,
                           Set<Long> likedIds) {
        CommentVO vo = new CommentVO();
        vo.setId(c.getId());
        vo.setLikeCount(c.getLikeCount());
        vo.setCreatedAt(c.getCreatedAt());
        vo.setIsAnonymous(c.getIsAnonymous() != null && c.getIsAnonymous() == 1);
        vo.setLiked(likedIds.contains(c.getId()));
        vo.setCanDelete(curUserId != null && (isAdmin || Objects.equals(c.getUserId(), curUserId)));
        vo.setParentId(c.getParentId());

        // 软删：内容占位 + 隐藏作者 + 禁止删除（作者已软删，管理员不能再操作；实际可由管理员二次删）
        if (c.getStatus() != null && c.getStatus() != 0) {
            vo.setContent(DELETED_PLACEHOLDER);
            vo.setDeleted(true);
            vo.setAuthorId(null);
            vo.setAuthorNickname(null);
            vo.setAuthorAvatarUrl(null);
            vo.setCanDelete(false);
            vo.setReplyToUserId(null);
            vo.setReplyToNickname(null);
            return vo;
        }

        vo.setContent(c.getContent());
        vo.setDeleted(false);

        // 作者信息（匿名隐藏）
        if (Boolean.TRUE.equals(vo.getIsAnonymous())) {
            vo.setAuthorNickname("匿名用户");
            vo.setAuthorAvatarUrl(null);
            vo.setAuthorId(null);
        } else {
            User author = userMap.get(c.getUserId());
            if (author != null) {
                vo.setAuthorId(author.getId());
                vo.setAuthorNickname(author.getNickname());
                vo.setAuthorAvatarUrl(author.getAvatarUrl());
            }
        }

        // @ 目标用户昵称
        if (c.getReplyToUserId() != null) {
            User target = userMap.get(c.getReplyToUserId());
            if (target != null) {
                vo.setReplyToUserId(target.getId());
                vo.setReplyToNickname(target.getNickname());
            }
        }
        return vo;
    }

    /** 批量查当前用户在这些评论里的点赞记录 */
    private Set<Long> collectLikedIds(Long userId, List<Comment> topLevel, List<Comment> children) {
        List<Long> ids = new ArrayList<>();
        topLevel.forEach(c -> ids.add(c.getId()));
        children.forEach(c -> ids.add(c.getId()));
        if (ids.isEmpty()) return Set.of();
        return commentLikeMapper.selectList(
                        new LambdaQueryWrapper<CommentLike>()
                                .eq(CommentLike::getUserId, userId)
                                .in(CommentLike::getCommentId, ids))
                .stream().map(CommentLike::getCommentId).collect(Collectors.toSet());
    }

    /** 包一层 SecurityUtils，避免 try-catch 让变量失去 effectively final */
    private static Long safeCurrentUserId() {
        try {
            return SecurityUtils.currentUserIdOrNull();
        } catch (Exception e) {
            return null;
        }
    }
}
