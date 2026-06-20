package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.dto.story.AppendSegmentRequest;
import com.xxx.treehole.dto.story.CreateStoryRequest;
import com.xxx.treehole.dto.story.StoryListVO;
import com.xxx.treehole.dto.story.StorySegmentVO;
import com.xxx.treehole.dto.story.StoryVO;
import com.xxx.treehole.entity.Story;
import com.xxx.treehole.entity.StorySegment;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.StoryMapper;
import com.xxx.treehole.mapper.StorySegmentMapper;
import com.xxx.treehole.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 协作故事业务：创建 / 列表 / 详情 / 续写 / 完结。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryMapper storyMapper;
    private final StorySegmentMapper segmentMapper;
    private final UserMapper userMapper;

    public Long create(Long userId, CreateStoryRequest req) {
        Story s = new Story();
        s.setUserId(userId);
        s.setTitle(req.getTitle());
        s.setOpening(req.getOpening());
        s.setIsAnonymous(Boolean.TRUE.equals(req.getIsAnonymous()) ? 1 : 0);
        s.setSegmentCount(1);
        s.setStatus(0);
        storyMapper.insert(s);
        return s.getId();
    }

    public StoryListVO list(int page, int size) {
        Page<Story> p = storyMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Story>()
                        .eq(Story::getStatus, 0)
                        .orderByDesc(Story::getUpdatedAt));
        StoryListVO vo = new StoryListVO();
        vo.setTotal(p.getTotal());
        if (p.getRecords().isEmpty()) {
            vo.setList(List.of());
            return vo;
        }
        Set<Long> authorIds = p.getRecords().stream().map(Story::getUserId).collect(Collectors.toSet());
        Map<Long, User> userMap = batchUsers(authorIds);
        vo.setList(p.getRecords().stream().map(s -> toListVO(s, userMap)).toList());
        return vo;
    }

    public StoryVO detail(Long id) {
        Story s = storyMapper.selectById(id);
        if (s == null) {
            throw new BusinessException(404, "故事不存在");
        }
        List<StorySegment> segments = segmentMapper.selectList(
                new LambdaQueryWrapper<StorySegment>()
                        .eq(StorySegment::getStoryId, id)
                        .orderByAsc(StorySegment::getCreatedAt));

        Set<Long> userIds = new java.util.HashSet<>();
        userIds.add(s.getUserId());
        segments.forEach(seg -> userIds.add(seg.getUserId()));
        Map<Long, User> userMap = batchUsers(userIds);

        StoryVO vo = new StoryVO();
        vo.setId(s.getId());
        vo.setTitle(s.getTitle());
        vo.setOpening(s.getOpening());
        vo.setIsAnonymous(s.getIsAnonymous() != null && s.getIsAnonymous() == 1);
        vo.setSegmentCount(s.getSegmentCount());
        vo.setStatus(s.getStatus());
        vo.setCreatedAt(s.getCreatedAt());
        vo.setUpdatedAt(s.getUpdatedAt());
        fillAuthor(vo, s.getUserId(), s.getIsAnonymous(), userMap);
        vo.setSegments(segments.stream().map(seg -> toSegVO(seg, userMap)).toList());
        return vo;
    }

    @Transactional
    public Long appendSegment(Long storyId, Long userId, AppendSegmentRequest req) {
        Story s = storyMapper.selectById(storyId);
        if (s == null) {
            throw new BusinessException(404, "故事不存在");
        }
        if (s.getStatus() != null && s.getStatus() == 1) {
            throw new BusinessException(400, "故事已完结，无法续写");
        }
        StorySegment seg = new StorySegment();
        seg.setStoryId(storyId);
        seg.setUserId(userId);
        seg.setContent(req.getContent());
        seg.setIsAnonymous(Boolean.TRUE.equals(req.getIsAnonymous()) ? 1 : 0);
        segmentMapper.insert(seg);

        // 更新故事段落数 + 更新时间（触发列表按 updated_at 排序）
        s.setSegmentCount((s.getSegmentCount() == null ? 1 : s.getSegmentCount()) + 1);
        storyMapper.updateById(s);
        return seg.getId();
    }

    /** 仅作者可完结 */
    public void finish(Long storyId, Long userId) {
        Story s = storyMapper.selectById(storyId);
        if (s == null) {
            throw new BusinessException(404, "故事不存在");
        }
        if (!userId.equals(s.getUserId())) {
            throw new BusinessException(403, "只有故事创建者可以完结");
        }
        s.setStatus(1);
        storyMapper.updateById(s);
    }

    // ============================================================
    // 内部
    // ============================================================

    private Map<Long, User> batchUsers(Set<Long> ids) {
        Map<Long, User> m = new HashMap<>();
        if (ids == null || ids.isEmpty()) return m;
        userMapper.selectBatchIds(ids).forEach(u -> m.put(u.getId(), u));
        return m;
    }

    private void fillAuthor(StoryVO vo, Long userId, Integer isAnonymous, Map<Long, User> userMap) {
        boolean anon = isAnonymous != null && isAnonymous == 1;
        if (anon) {
            vo.setAuthorNickname("匿名用户");
            return;
        }
        User u = userMap.get(userId);
        if (u != null) {
            vo.setAuthorId(u.getId());
            vo.setAuthorNickname(u.getNickname());
            vo.setAuthorAvatarUrl(u.getAvatarUrl());
        }
    }

    private StoryVO toListVO(Story s, Map<Long, User> userMap) {
        StoryVO vo = new StoryVO();
        vo.setId(s.getId());
        vo.setTitle(s.getTitle());
        vo.setIsAnonymous(s.getIsAnonymous() != null && s.getIsAnonymous() == 1);
        vo.setSegmentCount(s.getSegmentCount());
        vo.setStatus(s.getStatus());
        vo.setUpdatedAt(s.getUpdatedAt());
        // 列表只返回开头前 80 字，避免抢详情风头
        String opening = s.getOpening();
        vo.setOpening(opening.length() > 80 ? opening.substring(0, 80) + "…" : opening);
        vo.setCreatedAt(s.getCreatedAt());
        fillAuthor(vo, s.getUserId(), s.getIsAnonymous(), userMap);
        return vo;
    }

    private StorySegmentVO toSegVO(StorySegment seg, Map<Long, User> userMap) {
        StorySegmentVO vo = new StorySegmentVO();
        vo.setId(seg.getId());
        vo.setContent(seg.getContent());
        vo.setIsAnonymous(seg.getIsAnonymous() != null && seg.getIsAnonymous() == 1);
        vo.setCreatedAt(seg.getCreatedAt());
        boolean anon = Boolean.TRUE.equals(vo.getIsAnonymous());
        if (anon) {
            vo.setAuthorNickname("匿名用户");
        } else {
            User u = userMap.get(seg.getUserId());
            if (u != null) {
                vo.setAuthorId(u.getId());
                vo.setAuthorNickname(u.getNickname());
                vo.setAuthorAvatarUrl(u.getAvatarUrl());
            }
        }
        return vo;
    }
}
