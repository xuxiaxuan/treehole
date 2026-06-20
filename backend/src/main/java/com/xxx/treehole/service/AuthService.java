package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.common.JwtUtil;
import com.xxx.treehole.dto.auth.AuthResponse;
import com.xxx.treehole.dto.auth.ChangePasswordRequest;
import com.xxx.treehole.dto.auth.LoginRequest;
import com.xxx.treehole.dto.auth.RegisterRequest;
import com.xxx.treehole.dto.auth.UpdateProfileRequest;
import com.xxx.treehole.dto.auth.UserVO;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.PostMapper;
import com.xxx.treehole.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * 认证业务：注册 / 登录 / 当前用户 / 个人资料维护。
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final PostMapper postMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest req) {
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getEmail, req.getEmail()));
        if (count != null && count > 0) {
            throw new BusinessException("该邮箱已被注册");
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setNickname(req.getNickname());
        user.setBirthday(req.getBirthday());
        user.setRole(0);
        user.setStatus(0);
        userMapper.insert(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getEmail, req.getEmail()));
        if (user == null) {
            throw new BusinessException("邮箱或密码错误");
        }
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("邮箱或密码错误");
        }
        if (user.getStatus() != null && user.getStatus() == 1) {
            throw new BusinessException("账号已封禁");
        }
        return buildAuthResponse(user);
    }

    public User getCurrentUser(Long userId) {
        return userMapper.selectById(userId);
    }

    /**
     * 个人中心详情：基础信息 + 发帖/点赞统计。
     * 统计字段仅在此接口填充，登录/注册响应保持为 null。
     */
    public UserVO getProfileDetail(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        UserVO vo = toUserVO(user);
        vo.setPostCount(postMapper.countByUserId(userId));
        vo.setLikeReceivedTotal(postMapper.sumLikeCountByUserId(userId));
        return vo;
    }

    /**
     * 更新昵称与头像（emoji 字符串或 URL）。
     * birthday 字段：仅在请求显式传非 null 时更新（允许 null 清空）。
     * 越权防护：userId 一律来自 SecurityUtils，不信任请求体。
     */
    public UserVO updateProfile(Long userId, UpdateProfileRequest req) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        user.setNickname(req.getNickname());
        user.setAvatarUrl(req.getAvatarUrl());
        // MyBatis-Plus 默认不更新 null 字段，这里显式调用以支持清空
        if (req.getBirthday() != null) {
            user.setBirthday(req.getBirthday());
        }
        userMapper.updateById(user);
        return toUserVO(user);
    }

    /**
     * 修改密码：校验旧密码 → 写入新密码哈希。
     * 无状态 JWT 本期不强制失效，前端成功后主动 logout。
     */
    public void changePassword(Long userId, ChangePasswordRequest req) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        if (!passwordEncoder.matches(req.getOldPassword(), user.getPasswordHash())) {
            throw new BusinessException("原密码错误");
        }
        if (req.getOldPassword().equals(req.getNewPassword())) {
            throw new BusinessException("新密码不能与原密码相同");
        }
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userMapper.updateById(user);
    }

    /**
     * 管理端用户列表：可按状态/邮箱或昵称关键字过滤。
     * 返回 UserVO 列表（不含密码）。
     */
    public Map<String, Object> adminListUsers(int page, int size, Integer status, String keyword) {
        LambdaQueryWrapper<User> q = new LambdaQueryWrapper<User>().orderByDesc(User::getCreatedAt);
        if (status != null) {
            q.eq(User::getStatus, status);
        }
        if (keyword != null && !keyword.isBlank()) {
            q.and(w -> w.like(User::getEmail, keyword).or().like(User::getNickname, keyword));
        }
        Page<User> p = userMapper.selectPage(new Page<>(page, size), q);
        var list = p.getRecords().stream().map(AuthService::toUserVO).toList();
        return Map.of("list", list, "total", p.getTotal());
    }

    public void updateUserStatus(Long id, int status) {
        User u = userMapper.selectById(id);
        if (u == null) {
            throw new BusinessException(404, "用户不存在");
        }
        u.setStatus(status);
        userMapper.updateById(u);
    }

    public void updateUserRole(Long id, int role) {
        User u = userMapper.selectById(id);
        if (u == null) {
            throw new BusinessException(404, "用户不存在");
        }
        u.setRole(role);
        userMapper.updateById(u);
    }

    public AuthResponse buildAuthResponse(User user) {
        UserVO vo = toUserVO(user);
        AuthResponse resp = new AuthResponse();
        resp.setToken(jwtUtil.generateToken(user.getId(), user.getRole() == null ? 0 : user.getRole()));
        resp.setUser(vo);
        return resp;
    }

    public static UserVO toUserVO(User user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setEmail(user.getEmail());
        vo.setNickname(user.getNickname());
        vo.setBirthday(user.getBirthday());
        vo.setAvatarUrl(user.getAvatarUrl());
        vo.setRole(user.getRole());
        vo.setStatus(user.getStatus());
        vo.setCreatedAt(user.getCreatedAt());
        return vo;
    }
}
