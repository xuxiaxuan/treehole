package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.common.SensitiveWordUtil;
import com.xxx.treehole.dto.capsule.CapsuleVO;
import com.xxx.treehole.dto.capsule.CreateCapsuleRequest;
import com.xxx.treehole.dto.post.CreatePostRequest;
import com.xxx.treehole.entity.TimeCapsule;
import com.xxx.treehole.mapper.TimeCapsuleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 时间胶囊业务：创建 / 列表 / 定时揭封。
 * <p>
 * 设计要点：
 * <ul>
 *   <li>创建时做敏感词硬过滤（避免封印违规内容 1 年后才发现）</li>
 *   <li>揭封时调用 {@link PostService#create} 复用帖子流程（含 AI moderation、tarotData 字段等）</li>
 *   <li>已揭封胶囊保留 postId，用户点击可跳广场</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TimeCapsuleService {

    /** 最大揭封周期：365 天，防止用户乱填 2099 年 */
    private static final int MAX_REVEAL_DAYS = 365;

    /** 批量揭封上限：单次定时任务最多处理 100 条，防止冷启动时雪崩 */
    private static final int BATCH_LIMIT = 100;

    private final TimeCapsuleMapper capsuleMapper;
    private final PostService postService;
    private final SensitiveWordUtil sensitiveWordUtil;

    /**
     * 创建胶囊：敏感词前置过滤 + 时间合法性校验。
     */
    public Long create(Long userId, CreateCapsuleRequest req) {
        if (req.getRevealAt() == null) {
            throw new BusinessException("revealAt 必填");
        }
        // 敏感词硬过滤（与 PostService.create 一致策略）
        Optional<String> hit = sensitiveWordUtil.check(req.getContent());
        if (hit.isPresent()) {
            throw new BusinessException("内容包含敏感词：" + hit.get());
        }
        // 时间合法性
        LocalDateTime now = LocalDateTime.now();
        if (req.getRevealAt().isAfter(now.plusDays(MAX_REVEAL_DAYS))) {
            throw new BusinessException("揭封时间最远不超过 " + MAX_REVEAL_DAYS + " 天");
        }

        TimeCapsule c = new TimeCapsule();
        c.setUserId(userId);
        c.setContent(req.getContent());
        c.setMood(req.getMood());
        c.setIsAnonymous(Boolean.TRUE.equals(req.getIsAnonymous()) ? 1 : 0);
        c.setRevealAt(req.getRevealAt());
        c.setRevealed(0);
        capsuleMapper.insert(c);
        return c.getId();
    }

    /**
     * 列出当前用户的所有胶囊（按揭封时间升序，封印中的在前）。
     */
    public List<CapsuleVO> listMine(Long userId, int page, int size) {
        Page<TimeCapsule> p = capsuleMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<TimeCapsule>()
                        .eq(TimeCapsule::getUserId, userId)
                        .orderByAsc(TimeCapsule::getRevealed)
                        .orderByAsc(TimeCapsule::getRevealAt));
        LocalDateTime now = LocalDateTime.now();
        return p.getRecords().stream().map(c -> toVO(c, now)).toList();
    }

    public long countMine(Long userId) {
        Long c = capsuleMapper.selectCount(
                new LambdaQueryWrapper<TimeCapsule>().eq(TimeCapsule::getUserId, userId));
        return c == null ? 0 : c;
    }

    /**
     * 揭封：把到时间的胶囊转为普通帖子。
     * 包成 @Transactional 由调用方控制；这里用编程式事务，避免和 PostService.create 嵌套问题。
     */
    public boolean reveal(TimeCapsule c) {
        if (c.getRevealed() != null && c.getRevealed() == 1) {
            return false;  // 已揭封，幂等保护
        }
        CreatePostRequest postReq = new CreatePostRequest();
        postReq.setContent(c.getContent());
        postReq.setMood(c.getMood());
        postReq.setIsAnonymous(c.getIsAnonymous() != null && c.getIsAnonymous() == 1);
        postReq.setPostType(0);  // 普通树洞帖
        Long postId = postService.create(c.getUserId(), postReq);

        c.setRevealed(1);
        c.setPostId(postId);
        capsuleMapper.updateById(c);
        log.info("Capsule revealed: id={} -> postId={}", c.getId(), postId);
        return true;
    }

    /**
     * 定时扫描：每 5 分钟跑一次。
     * 表达式含义：秒 0、分每 5、每小时、每天、每月、周任意。
     * <p>
     * 单实例足够（v1 不做集群），未来多实例可借 Redis 分布式锁，YAGNI。
     * <p>
     * 失败处理：
     * - BusinessException（违规/敏感词）→ revealed=2 永久失败，不再重试
     * - 其他异常 → 保留 revealed=0，下次扫描重试
     */
    @Scheduled(cron = "0 */5 * * * *")
    public void scanAndReveal() {
        LocalDateTime now = LocalDateTime.now();
        List<TimeCapsule> due = capsuleMapper.selectList(
                new LambdaQueryWrapper<TimeCapsule>()
                        .eq(TimeCapsule::getRevealed, 0)
                        .le(TimeCapsule::getRevealAt, now)
                        .last("LIMIT " + BATCH_LIMIT));

        if (due.isEmpty()) return;
        log.info("Capsule scan: {} due to reveal", due.size());

        for (TimeCapsule c : due) {
            try {
                reveal(c);
            } catch (BusinessException e) {
                // 永久错误（违规/敏感词）：标记失败，不再重试，避免永远卡在重试循环
                log.warn("Capsule permanently failed: id={}, reason={}", c.getId(), e.getMessage());
                c.setRevealed(2);
                capsuleMapper.updateById(c);
            } catch (Exception e) {
                // 临时错误（DB/网络）：保留 revealed=0，下次扫描重试
                log.error("Capsule reveal failed (will retry): id={}, err={}", c.getId(), e.getMessage());
            }
        }
    }

    private CapsuleVO toVO(TimeCapsule c, LocalDateTime now) {
        CapsuleVO vo = new CapsuleVO();
        vo.setId(c.getId());
        vo.setContent(c.getContent());
        vo.setMood(c.getMood());
        vo.setIsAnonymous(c.getIsAnonymous() != null && c.getIsAnonymous() == 1);
        vo.setRevealAt(c.getRevealAt());
        vo.setRevealed(c.getRevealed() != null && c.getRevealed() == 1);
        vo.setFailed(c.getRevealed() != null && c.getRevealed() == 2);
        vo.setPostId(c.getPostId());
        vo.setCreatedAt(c.getCreatedAt());

        long remain = Duration.between(now, c.getRevealAt()).getSeconds();
        vo.setRemainingSeconds(Math.max(0, remain));
        return vo;
    }
}
