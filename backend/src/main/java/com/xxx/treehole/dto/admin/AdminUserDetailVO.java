package com.xxx.treehole.dto.admin;

import com.xxx.treehole.dto.auth.UserVO;
import com.xxx.treehole.dto.post.PostVO;
import lombok.Data;

import java.util.List;

/**
 * 管理端用户详情视图。
 * 继承用户基础字段 + 业务统计 + 最近发帖预览。
 */
@Data
public class AdminUserDetailVO {

    private Long id;
    private String email;
    private String nickname;
    private String avatarUrl;
    private Integer role;
    private Integer status;
    private java.time.LocalDateTime createdAt;

    /** 发帖总数（含所有状态） */
    private Long postCount;
    /** 收到点赞总数 */
    private Long likeReceivedTotal;
    /** 被举报总数（聚合其名下所有帖子） */
    private Long reportCount;
    /** 最近发帖预览（默认 5 条） */
    private List<PostVO> recentPosts;

    public static AdminUserDetailVO from(UserVO vo) {
        AdminUserDetailVO d = new AdminUserDetailVO();
        d.setId(vo.getId());
        d.setEmail(vo.getEmail());
        d.setNickname(vo.getNickname());
        d.setAvatarUrl(vo.getAvatarUrl());
        d.setRole(vo.getRole());
        d.setStatus(vo.getStatus());
        d.setCreatedAt(vo.getCreatedAt());
        return d;
    }
}
