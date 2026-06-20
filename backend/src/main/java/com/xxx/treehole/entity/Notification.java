package com.xxx.treehole.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 通知实体。
 * type: like_post / comment / reply / follow
 * read: 0=未读 1=已读
 * userId 是接收者，actorId 是触发者（永不相同，业务层过滤）
 */
@Data
@TableName("notifications")
public class Notification {

    /** 通知类型常量 */
    public static final String TYPE_LIKE_POST = "like_post";
    public static final String TYPE_COMMENT = "comment";
    public static final String TYPE_REPLY = "reply";
    public static final String TYPE_FOLLOW = "follow";

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long actorId;

    private String type;

    private Long postId;

    private Long commentId;

    /** 数据库字段名 read 是 MySQL 保留字，MyBatis-Plus 自动转义；实体用 read 字段名 */
    @TableField("`read`")
    private Integer read;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
