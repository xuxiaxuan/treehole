package com.xxx.treehole.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 帖子表实体。
 * isAnonymous: 0=实名 1=匿名
 * postType: 0=树洞 1=塔罗分享 2=Wordle 3=涂鸦
 * status: 0=正常 1=隐藏 2=删除
 * mood: 心情标签 calm/sad/anxious/warm/grateful，可空
 * tarotData: JSON 字符串，塔罗帖才填
 * aiSummary/aiTags: 管理员触发的 LLM 摘要与标签，可空（按需生成）
 */
@Data
@TableName("posts")
public class Post {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Integer isAnonymous;

    private String content;

    /** 心情：calm/sad/anxious/warm/grateful（可空） */
    private String mood;

    /** AI 生成的摘要（管理员触发，可空） */
    private String aiSummary;

    /** AI 生成的标签，逗号分隔（可空） */
    private String aiTags;

    private Integer postType;

    private String tarotData;

    private Integer likeCount;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
