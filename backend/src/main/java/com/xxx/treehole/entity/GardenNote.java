package com.xxx.treehole.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 私人心情花园日记：独立于 posts 表，默认私密。
 * <p>
 * stage: 0=种子 / 1=嫩芽 / 2=成长 / 3=盛开（每天打开花园自动 +1）
 * transplantedPostId: 移植到广场后的 posts.id；NULL=未移植（仍私密）
 */
@Data
@TableName("garden_notes")
public class GardenNote {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String content;

    /** 心情：calm/sad/anxious/warm/grateful（可空） */
    private String mood;

    private Integer stage;

    private Integer waterCount;

    private LocalDateTime lastWateredAt;

    private Long transplantedPostId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
