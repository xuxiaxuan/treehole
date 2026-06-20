package com.xxx.treehole.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 创建评论请求。
 * parentId 为 null 表示一级评论，否则是对某评论的回复。
 * replyToUserId 仅在回复「回复」时使用（平铺 @ 目标用户）。
 */
@Data
public class CreateCommentRequest {

    @NotBlank(message = "评论内容不能为空")
    @Size(max = 500, message = "评论最长 500 字")
    private String content;

    /** 父评论 ID；null=一级评论 */
    private Long parentId;

    /** @ 目标用户 ID；仅回复「回复」时填写（用于前端展示「@xxx」前缀） */
    private Long replyToUserId;

    /** 是否匿名评论 */
    private Boolean isAnonymous;
}
