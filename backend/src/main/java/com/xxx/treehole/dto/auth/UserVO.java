package com.xxx.treehole.dto.auth;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户对外展示对象（不含密码）。
 * postCount / likeReceivedTotal 仅在 profile 详情接口填充，其它场景可空。
 */
@Data
public class UserVO {

    private Long id;
    private String email;
    private String nickname;
    private LocalDate birthday;
    private String avatarUrl;
    private Integer role;
    private Integer status;
    private LocalDateTime createdAt;

    /** 个人中心统计：发帖总数 */
    private Long postCount;
    /** 个人中心统计：收到点赞总数 */
    private Long likeReceivedTotal;
}
