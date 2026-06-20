package com.xxx.treehole.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 共鸣房间匿名信：每用户每房间最多 1 封（业务层校验）。
 * revealed: 0=封缄（写信当天 22:00 前不可见） 1=已揭信
 * 收信方看到信件时不带 fromUserId（匿名）。
 */
@Data
@TableName("echo_letters")
public class EchoLetter {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long clusterId;

    /** 写信人（查询他人信件时不返回此字段） */
    private Long fromUserId;

    private String content;

    private Integer revealed;

    private LocalDateTime revealedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
