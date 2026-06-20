package com.xxx.treehole.dto.notification;

import lombok.Data;

import java.util.List;

@Data
public class NotificationListVO {
    private List<NotificationVO> list;
    private long unreadCount;
    private long total;
}
