package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.dto.danmaku.DanmakuVO;
import com.xxx.treehole.dto.danmaku.SendDanmakuRequest;
import com.xxx.treehole.entity.Danmaku;
import com.xxx.treehole.entity.Post;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.DanmakuMapper;
import com.xxx.treehole.mapper.PostMapper;
import com.xxx.treehole.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 弹幕业务：发送 / 列表。
 * lane 字段后端按 id % 10 分配，保证弹幕在 10 条轨道间均匀分布，避免前端每条都重算。
 */
@Service
@RequiredArgsConstructor
public class DanmakuService {

    private static final int LANE_COUNT = 10;

    private final DanmakuMapper danmakuMapper;
    private final PostMapper postMapper;
    private final UserMapper userMapper;

    public Long send(Long postId, Long userId, SendDanmakuRequest req) {
        Post post = postMapper.selectById(postId);
        if (post == null || post.getStatus() == null || post.getStatus() != 0) {
            throw new BusinessException(404, "帖子不存在");
        }
        Danmaku d = new Danmaku();
        d.setPostId(postId);
        d.setUserId(userId);
        d.setContent(req.getContent());
        d.setColor(req.getColor() == null || req.getColor().isBlank() ? "#3d7a4d" : req.getColor());
        d.setIsAnonymous(Boolean.TRUE.equals(req.getIsAnonymous()) ? 1 : 0);
        danmakuMapper.insert(d);
        return d.getId();
    }

    public List<DanmakuVO> listByPost(Long postId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 10), 200);
        List<Danmaku> records = danmakuMapper.selectList(
                new LambdaQueryWrapper<Danmaku>()
                        .eq(Danmaku::getPostId, postId)
                        .orderByAsc(Danmaku::getCreatedAt)
                        .last("LIMIT " + safeLimit));
        if (records.isEmpty()) return List.of();

        Set<Long> userIds = records.stream()
                .filter(d -> d.getIsAnonymous() == null || d.getIsAnonymous() == 0)
                .map(Danmaku::getUserId)
                .collect(Collectors.toSet());
        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            userMapper.selectBatchIds(userIds).forEach(u -> userMap.put(u.getId(), u));
        }

        return records.stream().map(d -> {
            DanmakuVO vo = new DanmakuVO();
            vo.setId(d.getId());
            vo.setContent(d.getContent());
            vo.setColor(d.getColor());
            vo.setIsAnonymous(d.getIsAnonymous() != null && d.getIsAnonymous() == 1);
            vo.setCreatedAt(d.getCreatedAt());
            // lane 按 id 哈希均匀分布到 10 条轨道
            vo.setLane((int) (d.getId() % LANE_COUNT));
            if (!Boolean.TRUE.equals(vo.getIsAnonymous())) {
                User u = userMap.get(d.getUserId());
                if (u != null) vo.setAuthorNickname(u.getNickname());
            }
            return vo;
        }).toList();
    }
}
