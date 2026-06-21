package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.common.SensitiveWordUtil;
import com.xxx.treehole.dto.post.CreatePostRequest;
import com.xxx.treehole.dto.post.PostListVO;
import com.xxx.treehole.dto.post.PostVO;
import com.xxx.treehole.dto.post.WarmReplyVO;
import com.xxx.treehole.entity.Like;
import com.xxx.treehole.entity.Notification;
import com.xxx.treehole.entity.Post;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.LikeMapper;
import com.xxx.treehole.mapper.PostMapper;
import com.xxx.treehole.mapper.UserMapper;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.ai.AiService;
import com.xxx.treehole.service.ai.ModerationResult;
import com.xxx.treehole.service.ai.SummarizeResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 帖子业务：发帖 / 列表 / 详情 / 点赞 / 温暖回复 / AI 摘要。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostMapper postMapper;
    private final UserMapper userMapper;
    private final LikeMapper likeMapper;
    private final SensitiveWordUtil sensitiveWordUtil;
    private final AiService aiService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.fallback.warm-reply:你的声音被听到了，请照顾好自己。}")
    private String warmReplyFallback;

    public Long create(Long userId, CreatePostRequest req) {
        // 1. 敏感词硬过滤（零延迟，优先于 LLM）
        var hit = sensitiveWordUtil.check(req.getContent());
        if (hit.isPresent()) {
            throw new BusinessException("内容包含敏感词：" + hit.get());
        }
        // 2. 塔罗帖基础校验
        if (req.getPostType() != null && req.getPostType() == 1
                && (req.getTarotData() == null || req.getTarotData().isBlank())) {
            throw new BusinessException("塔罗分享帖必须包含 tarotData");
        }
        // 3. LLM 兜底审核：fail-open（失败放行，靠举报兜底）
        //    Noop 实现返回 null，自动放行；不阻塞主流程
        try {
            ModerationResult mr = aiService.moderatePost(req.getContent());
            if (mr != null && !mr.pass()) {
                throw new BusinessException("内容涉嫌违规（" + mr.category() + "）");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("LLM moderation unexpected error, fail-open: {}", e.getMessage());
        }

        Post post = new Post();
        post.setUserId(userId);
        post.setIsAnonymous(Boolean.TRUE.equals(req.getIsAnonymous()) ? 1 : 0);
        post.setContent(req.getContent());
        post.setMood(req.getMood());
        post.setPostType(req.getPostType() == null ? 0 : req.getPostType());
        post.setTarotData(req.getTarotData());
        post.setLikeCount(0);
        post.setStatus(0);
        postMapper.insert(post);
        return post.getId();
    }

    /**
     * 广场列表（公开）：支持类型 / 排序 / 心情 / 匿名筛选。
     *
     * @param postType  帖子类型：0=树洞 1=塔罗 2=Wordle 3=涂鸦
     * @param sort      排序：new=最新（默认） / hot=热门（近 7 天按 like_count 倒序）
     * @param mood      心情筛选：calm/sad/anxious/warm/grateful
     * @param anonymous 是否只看匿名帖
     */
    public PostListVO list(int page, int size, Integer postType, String sort, String mood, Boolean anonymous) {
        LambdaQueryWrapper<Post> q = new LambdaQueryWrapper<>();
        q.eq(Post::getStatus, 0);
        if (postType != null) {
            q.eq(Post::getPostType, postType);
        }
        if (mood != null && !mood.isBlank()) {
            q.eq(Post::getMood, mood);
        }
        if (Boolean.TRUE.equals(anonymous)) {
            q.eq(Post::getIsAnonymous, 1);
        }

        // 排序策略
        if ("hot".equalsIgnoreCase(sort)) {
            // 热门：近 7 天 + 按点赞数倒序（同赞数按时间倒序）
            LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
            q.ge(Post::getCreatedAt, weekAgo)
                    .orderByDesc(Post::getLikeCount)
                    .orderByDesc(Post::getCreatedAt);
        } else {
            // 默认：最新
            q.orderByDesc(Post::getCreatedAt);
        }

        Page<Post> p = postMapper.selectPage(new Page<>(page, size), q);
        PostListVO vo = new PostListVO();
        vo.setTotal(p.getTotal());
        vo.setList(toVOList(p.getRecords()));
        return vo;
    }

    /**
     * 帖子搜索：按关键词模糊匹配 content（仅 status=0 正常帖）。
     * v1 用 LIKE，未来量大可升级 ES（YAGNI）。
     */
    public PostListVO search(String q, int page, int size, Integer postType) {
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, 0)
                .like(Post::getContent, q)
                .orderByDesc(Post::getCreatedAt);
        if (postType != null) {
            wrapper.eq(Post::getPostType, postType);
        }
        Page<Post> p = postMapper.selectPage(new Page<>(page, size), wrapper);
        PostListVO vo = new PostListVO();
        vo.setTotal(p.getTotal());
        vo.setList(toVOList(p.getRecords()));
        return vo;
    }

    public PostVO detail(Long id) {
        Post post = postMapper.selectById(id);
        if (post == null || post.getStatus() == null || post.getStatus() != 0) {
            throw new BusinessException(404, "帖子不存在或已被删除");
        }
        return toVO(post);
    }

    /**
     * 管理端列表：可按状态/关键字过滤（含已删除/隐藏帖）。
     */
    public PostListVO adminList(int page, int size, Integer status, String keyword) {
        LambdaQueryWrapper<Post> q = new LambdaQueryWrapper<>();
        if (status != null) {
            q.eq(Post::getStatus, status);
        }
        if (keyword != null && !keyword.isBlank()) {
            q.like(Post::getContent, keyword);
        }
        q.orderByDesc(Post::getCreatedAt);
        Page<Post> p = postMapper.selectPage(new Page<>(page, size), q);
        PostListVO vo = new PostListVO();
        vo.setTotal(p.getTotal());
        vo.setList(toVOList(p.getRecords()));
        return vo;
    }

    /**
     * 某用户的发帖历史（管理端用：含所有状态、不匿名化、不查 liked）。
     */
    public PostListVO listByUser(Long userId, int page, int size) {
        LambdaQueryWrapper<Post> q = new LambdaQueryWrapper<Post>()
                .eq(Post::getUserId, userId)
                .orderByDesc(Post::getCreatedAt);
        Page<Post> p = postMapper.selectPage(new Page<>(page, size), q);
        PostListVO vo = new PostListVO();
        vo.setTotal(p.getTotal());
        vo.setList(toAdminVOList(p.getRecords()));
        return vo;
    }

    /**
     * 更新帖子状态：0=正常 1=隐藏 2=删除。
     */
    public void updatePostStatus(Long id, int status) {
        Post p = postMapper.selectById(id);
        if (p == null) {
            throw new BusinessException(404, "帖子不存在");
        }
        p.setStatus(status);
        postMapper.updateById(p);
    }

    @Transactional
    public Map<String, Object> toggleLike(Long userId, Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null || post.getStatus() == null || post.getStatus() != 0) {
            throw new BusinessException(404, "帖子不存在");
        }
        Like existing = likeMapper.selectOne(
                new LambdaQueryWrapper<Like>()
                        .eq(Like::getUserId, userId)
                        .eq(Like::getPostId, postId));

        boolean liked;
        if (existing == null) {
            Like l = new Like();
            l.setUserId(userId);
            l.setPostId(postId);
            likeMapper.insert(l);
            post.setLikeCount((post.getLikeCount() == null ? 0 : post.getLikeCount()) + 1);
            liked = true;
        } else {
            likeMapper.deleteById(existing.getId());
            post.setLikeCount(Math.max(0, (post.getLikeCount() == null ? 0 : post.getLikeCount()) - 1));
            liked = false;
        }
        postMapper.updateById(post);
        // 点赞成功（非取消）→ 给帖子作者发通知
        if (liked) {
            notificationService.notify(post.getUserId(), userId,
                    Notification.TYPE_LIKE_POST, post.getId(), null);
        }
        return Map.of("liked", liked, "likeCount", post.getLikeCount());
    }

    /**
     * 为某帖子生成温暖回复。
     * LLM 不可用（返回 null）时返回兜底文案，fallback=true。
     */
    public WarmReplyVO generateWarmReply(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null || post.getStatus() == null || post.getStatus() != 0) {
            throw new BusinessException(404, "帖子不存在");
        }
        String reply = aiService.warmReply(post.getContent());
        return reply == null || reply.isBlank()
                ? WarmReplyVO.ofFallback(warmReplyFallback)
                : WarmReplyVO.of(reply);
    }

    /**
     * 为某帖子生成摘要 + 标签并缓存到 posts 表（管理员触发）。
     * LLM 不可用时直接抛 503，让管理员重试，不污染数据库字段。
     */
    public SummarizeResult generateSummary(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException(404, "帖子不存在");
        }
        SummarizeResult result = aiService.summarize(post.getContent());
        if (result == null) {
            throw new BusinessException(503, "AI 服务暂时不可用");
        }
        // 缓存：拼成逗号分隔字符串存储
        String tagsStr = String.join(",", Optional.ofNullable(result.tags()).orElse(List.of()));
        post.setAiSummary(result.summary());
        post.setAiTags(tagsStr);
        postMapper.updateById(post);
        return result;
    }

    /**
     * Entity -> VO（用户端）：匿名帖隐藏作者、当前用户点赞状态。
     * 单帖详情用；列表场景请用 {@link #toVOList} 避免 N+1。
     */
    public PostVO toVO(Post post) {
        return toVOList(List.of(post)).get(0);
    }

    /**
     * Entity -> VO（管理端）：不匿名化、不查 liked。
     * 单帖用；列表场景请用 {@link #toAdminVOList}。
     */
    public PostVO toAdminVO(Post post) {
        return toAdminVOList(List.of(post)).get(0);
    }

    /**
     * 批量转 VO（用户端）：避免列表场景的 N+1 查询。
     * <p>
     * 优化点（原先每帖 2 次额外查询，20 帖 = 40 次 SQL）：
     * <ul>
     *   <li>一次 selectBatchIds 拉所有作者</li>
     *   <li>一次 likeMapper.selectList(in postIds) 拉当前用户所有 liked</li>
     * </ul>
     */
    public List<PostVO> toVOList(List<Post> posts) {
        if (posts.isEmpty()) return List.of();

        // 批量查作者（仅实名帖）
        Set<Long> authorIds = posts.stream()
                .filter(p -> p.getIsAnonymous() == null || p.getIsAnonymous() == 0)
                .map(Post::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, User> authorMap = authorIds.isEmpty()
                ? Map.of()
                : userMapper.selectBatchIds(authorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        // 批量查当前用户 liked 的 post id
        Set<Long> likedIds = batchLikedIds(posts);

        return posts.stream().map(p -> {
            PostVO vo = buildBaseVO(p);
            if (vo.getIsAnonymous()) {
                vo.setAuthorNickname("匿名用户");
                vo.setAuthorAvatarUrl(null);
                vo.setAuthorId(null);
            } else {
                User author = authorMap.get(p.getUserId());
                if (author != null) {
                    vo.setAuthorId(author.getId());
                    vo.setAuthorNickname(author.getNickname());
                    vo.setAuthorAvatarUrl(author.getAvatarUrl());
                }
            }
            vo.setLiked(likedIds.contains(p.getId()));
            return vo;
        }).toList();
    }

    /**
     * 批量转 VO（管理端）：不匿名化、不查 liked。
     */
    public List<PostVO> toAdminVOList(List<Post> posts) {
        if (posts.isEmpty()) return List.of();
        Set<Long> authorIds = posts.stream()
                .map(Post::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, User> authorMap = authorIds.isEmpty()
                ? Map.of()
                : userMapper.selectBatchIds(authorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        return posts.stream().map(p -> {
            PostVO vo = buildBaseVO(p);
            User author = authorMap.get(p.getUserId());
            if (author != null) {
                vo.setAuthorId(author.getId());
                vo.setAuthorNickname(author.getNickname());
                vo.setAuthorAvatarUrl(author.getAvatarUrl());
            }
            vo.setLiked(false);
            return vo;
        }).toList();
    }

    /**
     * 批量查当前登录用户在给定 posts 里 liked 过的 post id 集合。
     * 未登录返回空集。
     */
    private Set<Long> batchLikedIds(List<Post> posts) {
        Long curUserId;
        try {
            curUserId = SecurityUtils.currentUserId();
        } catch (Exception e) {
            return Set.of();
        }
        if (curUserId == null) return Set.of();
        List<Long> postIds = posts.stream().map(Post::getId).filter(Objects::nonNull).toList();
        if (postIds.isEmpty()) return Set.of();
        return likeMapper.selectList(
                        new LambdaQueryWrapper<Like>()
                                .eq(Like::getUserId, curUserId)
                                .in(Like::getPostId, postIds))
                .stream()
                .map(Like::getPostId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    /**
     * 抽取公共字段映射：id / content / postType / likeCount / createdAt / isAnonymous / tarotData / mood。
     */
    private PostVO buildBaseVO(Post post) {
        PostVO vo = new PostVO();
        vo.setId(post.getId());
        vo.setContent(post.getContent());
        vo.setPostType(post.getPostType());
        vo.setLikeCount(post.getLikeCount());
        vo.setCreatedAt(post.getCreatedAt());
        vo.setMood(post.getMood());
        vo.setIsAnonymous(post.getIsAnonymous() != null && post.getIsAnonymous() == 1);

        if (post.getTarotData() != null && !post.getTarotData().isBlank()) {
            try {
                vo.setTarotData(objectMapper.readValue(post.getTarotData(), Object.class));
            } catch (Exception e) {
                log.warn("Failed to parse tarotData for post {}: {}", post.getId(), e.getMessage());
            }
        }
        return vo;
    }

    private void fillAuthor(PostVO vo, Long userId) {
        if (userId == null) {
            return;
        }
        User author = userMapper.selectById(userId);
        if (author != null) {
            vo.setAuthorId(author.getId());
            vo.setAuthorNickname(author.getNickname());
            vo.setAuthorAvatarUrl(author.getAvatarUrl());
        }
    }
}
