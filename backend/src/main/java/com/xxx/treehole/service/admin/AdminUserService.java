package com.xxx.treehole.service.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.dto.admin.AdminUserDetailVO;
import com.xxx.treehole.dto.auth.UserVO;
import com.xxx.treehole.dto.post.PostListVO;
import com.xxx.treehole.entity.Post;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.PostMapper;
import com.xxx.treehole.mapper.ReportMapper;
import com.xxx.treehole.mapper.UserMapper;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.AuthService;
import com.xxx.treehole.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 管理端用户业务：列表 / 详情 / 发帖历史 / 角色&状态管理。
 * 自保护：禁止管理员修改自己的角色或封禁自己。
 */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final int RECENT_POSTS_LIMIT = 5;

    private final UserMapper userMapper;
    private final PostMapper postMapper;
    private final ReportMapper reportMapper;
    private final PostService postService;
    private final AuthService authService;

    /**
     * 管理端用户列表（按 createdAt 倒序，可按状态/关键字过滤）。
     */
    public Map<String, Object> listUsers(int page, int size, Integer status, String keyword) {
        return authService.adminListUsers(page, size, status, keyword);
    }

    /**
     * 用户详情：基础信息 + 发帖/点赞/举报统计 + 最近 5 条发帖。
     */
    public AdminUserDetailVO getUserDetail(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        AdminUserDetailVO vo = AdminUserDetailVO.from(AuthService.toUserVO(user));
        vo.setPostCount(postMapper.countByUserId(id));
        vo.setLikeReceivedTotal(postMapper.sumLikeCountByUserId(id));
        vo.setReportCount(reportMapper.countByPostAuthor(id));

        Page<Post> recent = postMapper.selectPage(
                new Page<>(1, RECENT_POSTS_LIMIT),
                new LambdaQueryWrapper<Post>()
                        .eq(Post::getUserId, id)
                        .orderByDesc(Post::getCreatedAt));
        List<com.xxx.treehole.dto.post.PostVO> recentVOs = recent.getRecords().stream()
                .map(postService::toAdminVO)
                .toList();
        vo.setRecentPosts(recentVOs);
        return vo;
    }

    /**
     * 某用户发帖历史（分页，含所有状态、不匿名化）。
     */
    public PostListVO listUserPosts(Long id, int page, int size) {
        if (userMapper.selectById(id) == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return postService.listByUser(id, page, size);
    }

    /**
     * 更新用户状态：0=正常 1=封禁。
     * 自保护：禁止封禁自己。
     */
    public void updateUserStatus(Long id, int status) {
        Long currentId = SecurityUtils.currentUserId();
        if (id.equals(currentId)) {
            throw new BusinessException("禁止修改自己的账号状态");
        }
        authService.updateUserStatus(id, status);
    }

    /**
     * 更新用户角色：0=普通用户 1=管理员。
     * 自保护：禁止修改自己的角色。
     */
    public void updateUserRole(Long id, int role) {
        Long currentId = SecurityUtils.currentUserId();
        if (id.equals(currentId)) {
            throw new BusinessException("禁止修改自己的角色");
        }
        authService.updateUserRole(id, role);
    }
}
