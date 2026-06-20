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
import com.xxx.treehole.entity.Post;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.LikeMapper;
import com.xxx.treehole.mapper.PostMapper;
import com.xxx.treehole.mapper.UserMapper;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.ai.AiService;
import com.xxx.treehole.service.ai.ModerationResult;
import com.xxx.treehole.service.ai.SummarizeResult;
import com.xxx.treehole.entity.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    public PostListVO list(int page, int size, Integer postType) {
        LambdaQueryWrapper<Post> q = new LambdaQueryWrapper<>();
        q.eq(Post::getStatus, 0).orderByDesc(Post::getCreatedAt);
        if (postType != null) {
            q.eq(Post::getPostType, postType);
        }

        Page<Post> p = postMapper.selectPage(new Page<>(page, size), q);
        PostListVO vo = new PostListVO();
        vo.setTotal(p.getTotal());
        vo.setList(p.getRecords().stream().map(this::toVO).toList());
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
        vo.setList(p.getRecords().stream().map(this::toVO).toList());
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
        vo.setList(p.getRecords().stream().map(this::toVO).toList());
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
        vo.setList(p.getRecords().stream().map(this::toAdminVO).toList());
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
     */
    public PostVO toVO(Post post) {
        PostVO vo = buildBaseVO(post);

        if (vo.getIsAnonymous()) {
            vo.setAuthorNickname("匿名用户");
            vo.setAuthorAvatarUrl(null);
            vo.setAuthorId(null);
        } else {
            fillAuthor(vo, post.getUserId());
        }

        // 未登录场景：liked=false
        try {
            Long curUserId = SecurityUtils.currentUserId();
            Long liked = likeMapper.selectCount(
                    new LambdaQueryWrapper<Like>()
                            .eq(Like::getUserId, curUserId)
                            .eq(Like::getPostId, post.getId()));
            vo.setLiked(liked != null && liked > 0);
        } catch (Exception e) {
            vo.setLiked(false);
        }
        return vo;
    }

    /**
     * Entity -> VO（管理端）：不匿名化、不查 liked。
     * 用于用户详情页的发帖历史展示（含真实作者）。
     */
    public PostVO toAdminVO(Post post) {
        PostVO vo = buildBaseVO(post);
        fillAuthor(vo, post.getUserId());
        vo.setLiked(false);
        return vo;
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
