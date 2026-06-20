package com.xxx.treehole.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 评论点赞表实体。同用户对同评论只能点赞一次（DB 唯一约束）。
 */
@Data
@TableName("comment_likes")
public class CommentLike {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long commentId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
