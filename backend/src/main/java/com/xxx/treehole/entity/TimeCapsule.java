package com.xxx.treehole.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 时间胶囊实体。
 * revealed: 0=封印中（content 不公开） 1=已揭封（已生成对应 post）
 * postId: 揭封后回填的 posts.id，便于点击胶囊跳到广场上的帖子
 */
@Data
@TableName("time_capsules")
public class TimeCapsule {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String content;

    /** 心情标签，calm/sad/anxious/warm/grateful（可空） */
    private String mood;

    /** 揭封后是否匿名出现在广场 */
    private Integer isAnonymous;

    /** 揭封时间 */
    private LocalDateTime revealAt;

    /** 0=封印 1=已揭 */
    private Integer revealed;

    /** 揭封后生成的 posts.id */
    private Long postId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
