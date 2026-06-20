package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.notification.NotificationListVO;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 通知接口：登录可用。
 * 列表 / 未读数 / 全部已读。
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public Result<NotificationListVO> list(@RequestParam(defaultValue = "1") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(notificationService.listForUser(userId, page, size));
    }

    @GetMapping("/unread-count")
    public Result<Map<String, Long>> unreadCount() {
        Long userId = SecurityUtils.currentUserId();
        return Result.success(Map.of("unreadCount", notificationService.unreadCount(userId)));
    }

    @PostMapping("/read-all")
    public Result<Map<String, Long>> readAll() {
        Long userId = SecurityUtils.currentUserId();
        long updated = notificationService.markAllRead(userId);
        return Result.success(Map.of("updated", updated));
    }
}
