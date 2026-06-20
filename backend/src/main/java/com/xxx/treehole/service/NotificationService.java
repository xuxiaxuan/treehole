package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xxx.treehole.dto.notification.NotificationListVO;
import com.xxx.treehole.dto.notification.NotificationVO;
import com.xxx.treehole.entity.Comment;
import com.xxx.treehole.entity.Notification;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.CommentMapper;
import com.xxx.treehole.mapper.NotificationMapper;
import com.xxx.treehole.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 通知业务：创建 / 列表 / 标记已读。
 * 创建时给自己不触发（actorId == userId 时跳过）。
 * 对 "点赞" 类做轻量去重：最近 1 小时同 actor+type+postId 只发一次。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;
    private final UserMapper userMapper;
    private final CommentMapper commentMapper;

    /** 通知接收者 userId；actorId 触发者；type 见常量 */
    public void notify(Long userId, Long actorId, String type, Long postId, Long commentId) {
        if (userId == null || actorId == null || Objects.equals(userId, actorId)) {
            return;  // 自己触发自己，不发
        }
        // 点赞类去重：1 小时内同 actor+type+post 不重复
        if (Notification.TYPE_LIKE_POST.equals(type) && postId != null) {
            Long dup = notificationMapper.selectCount(new LambdaQueryWrapper<Notification>()
                    .eq(Notification::getUserId, userId)
                    .eq(Notification::getActorId, actorId)
                    .eq(Notification::getType, type)
                    .eq(Notification::getPostId, postId)
                    .ge(Notification::getCreatedAt, java.time.LocalDateTime.now().minusHours(1)));
            if (dup != null && dup > 0) {
                return;
            }
        }
        Notification n = new Notification();
        n.setUserId(userId);
        n.setActorId(actorId);
        n.setType(type);
        n.setPostId(postId);
        n.setCommentId(commentId);
        n.setRead(0);
        notificationMapper.insert(n);
    }

    /** 列表：按 created_at desc 分页；附带未读总数 */
    public NotificationListVO listForUser(Long userId, int page, int size) {
        NotificationListVO result = new NotificationListVO();

        Long unread = notificationMapper.selectCount(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getRead, 0));
        result.setUnreadCount(unread == null ? 0 : unread);

        Page<Notification> p = notificationMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getUserId, userId)
                        .orderByDesc(Notification::getCreatedAt));
        result.setTotal(p.getTotal());

        List<Notification> records = p.getRecords();
        if (records.isEmpty()) {
            result.setList(List.of());
            return result;
        }

        // 批量查 actor 用户信息（避免 N+1）
        var actorIds = records.stream().map(Notification::getActorId).filter(Objects::nonNull).distinct().toList();
        Map<Long, User> actorMap = new HashMap<>();
        if (!actorIds.isEmpty()) {
            userMapper.selectBatchIds(actorIds).forEach(u -> actorMap.put(u.getId(), u));
        }

        // 批量查 comment 摘要
        var commentIds = records.stream().map(Notification::getCommentId).filter(Objects::nonNull).distinct().toList();
        Map<Long, String> commentSnippetMap = new HashMap<>();
        if (!commentIds.isEmpty()) {
            commentMapper.selectBatchIds(commentIds).forEach(c -> {
                String snippet = c.getContent();
                if (snippet != null && snippet.length() > 50) {
                    snippet = snippet.substring(0, 50) + "…";
                }
                commentSnippetMap.put(c.getId(), snippet);
            });
        }

        List<NotificationVO> list = records.stream().map(n -> {
            NotificationVO vo = new NotificationVO();
            vo.setId(n.getId());
            vo.setType(n.getType());
            vo.setActorId(n.getActorId());
            vo.setPostId(n.getPostId());
            vo.setCommentId(n.getCommentId());
            vo.setRead(n.getRead() != null && n.getRead() == 1);
            vo.setCreatedAt(n.getCreatedAt());
            User actor = actorMap.get(n.getActorId());
            if (actor != null) {
                vo.setActorNickname(actor.getNickname());
                vo.setActorAvatarUrl(actor.getAvatarUrl());
            }
            if (n.getCommentId() != null) {
                vo.setSnippet(commentSnippetMap.get(n.getCommentId()));
            }
            return vo;
        }).toList();
        result.setList(list);
        return result;
    }

    /** 标记所有未读为已读 */
    public long markAllRead(Long userId) {
        Notification cond = new Notification();
        cond.setRead(1);
        return notificationMapper.update(cond, new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getRead, 0));
    }

    /** 仅查询未读数（Navbar 红点轮询用，开销最小） */
    public long unreadCount(Long userId) {
        Long c = notificationMapper.selectCount(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getRead, 0));
        return c == null ? 0 : c;
    }
}
