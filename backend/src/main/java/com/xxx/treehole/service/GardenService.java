package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.common.SensitiveWordUtil;
import com.xxx.treehole.dto.garden.CreateGardenNoteRequest;
import com.xxx.treehole.dto.garden.GardenNoteVO;
import com.xxx.treehole.dto.garden.GardenVO;
import com.xxx.treehole.dto.garden.PlantVO;
import com.xxx.treehole.dto.post.CreatePostRequest;
import com.xxx.treehole.entity.GardenNote;
import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.GardenNoteMapper;
import com.xxx.treehole.mapper.UserMapper;
import com.xxx.treehole.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 心情花园业务（V2 改造版）：**私人心情日记**，与广场完全解耦。
 * <p>
 * 设计哲学：
 * <ul>
 *   <li>广场 = 自己和所有人的对话（公开）</li>
 *   <li>花园 = 自己和自己的对话（私密）</li>
 *   <li>共鸣 = 自己和相似陌生人的对话（匿名连接）</li>
 * </ul>
 * <p>
 * 浇水机制：用户每天打开花园自动 +1 stage；显式"浇水"按钮额外 +1（每天最多一次）。
 * 生长阶段：种子(0) → 嫩芽(1) → 成长(2) → 盛开(3)，封顶 3。
 */
@Service
@RequiredArgsConstructor
public class GardenService {

    /** 最大日记条数：避免单用户无限堆积 */
    private static final int MAX_NOTES = 500;

    private final GardenNoteMapper noteMapper;
    private final UserMapper userMapper;
    private final PostService postService;
    private final SensitiveWordUtil sensitiveWordUtil;

    // ============================================================
    // 花园视图：植物网格（仅作者本人能看）
    // ============================================================

    /**
     * 查看自己的花园：
     * - 顺便给所有未盛开植物 stage +1（每天打开花园自动生长一次）
     * - 他人花园不可访问（隐私保护）
     * <p>
     * 加 @Transactional 保证读-改-写一致性（dailyAutoGrow 改 stage 后立刻可被查询看到）。
     */
    @Transactional
    public GardenVO myGarden() {
        Long userId = SecurityUtils.currentUserId();
        User owner = userMapper.selectById(userId);
        if (owner == null) {
            throw new BusinessException(404, "用户不存在");
        }

        // 每日首次访问：自动浇一次水（stage +1，封顶 3）
        dailyAutoGrow(userId);

        List<GardenNote> notes = noteMapper.selectList(
                new LambdaQueryWrapper<GardenNote>()
                        .eq(GardenNote::getUserId, userId)
                        .orderByAsc(GardenNote::getCreatedAt));

        LocalDateTime now = LocalDateTime.now();
        Map<String, Integer> stats = new LinkedHashMap<>();
        int totalWater = 0;

        List<PlantVO> plants = notes.stream().map(n -> {
            PlantVO vo = new PlantVO();
            vo.setPostId(n.getId());  // 复用 postId 字段传 noteId，前端点击进入日记编辑
            vo.setMood(n.getMood());
            vo.setStage(n.getStage());
            vo.setWater(n.getWaterCount());
            vo.setPlantedAt(n.getCreatedAt());
            String c = n.getContent();
            vo.setSnippet(c.length() > 50 ? c.substring(0, 50) + "…" : c);
            return vo;
        }).toList();

        for (GardenNote n : notes) {
            if (n.getMood() != null) stats.merge(n.getMood(), 1, Integer::sum);
            totalWater += n.getWaterCount() == null ? 0 : n.getWaterCount();
        }

        GardenVO vo = new GardenVO();
        vo.setUserId(userId);
        vo.setNickname(owner.getNickname());
        vo.setMine(true);
        vo.setPlants(plants);
        vo.setStats(stats);
        vo.setTotalWater(totalWater);
        return vo;
    }

    // ============================================================
    // 日记 CRUD
    // ============================================================

    public Long createNote(Long userId, CreateGardenNoteRequest req) {
        Optional<String> hit = sensitiveWordUtil.check(req.getContent());
        if (hit.isPresent()) {
            throw new BusinessException("内容包含敏感词：" + hit.get());
        }
        Long count = noteMapper.selectCount(
                new LambdaQueryWrapper<GardenNote>().eq(GardenNote::getUserId, userId));
        if (count != null && count >= MAX_NOTES) {
            throw new BusinessException("花园里植物太多了（上限 " + MAX_NOTES + " 株）");
        }

        GardenNote n = new GardenNote();
        n.setUserId(userId);
        n.setContent(req.getContent());
        n.setMood(req.getMood());
        n.setStage(0);
        n.setWaterCount(0);
        noteMapper.insert(n);
        return n.getId();
    }

    public GardenNoteVO noteDetail(Long userId, Long noteId) {
        GardenNote n = noteMapper.selectById(noteId);
        if (n == null || !userId.equals(n.getUserId())) {
            throw new BusinessException(404, "日记不存在");
        }
        return toVO(n);
    }

    public List<GardenNoteVO> listNotes(Long userId) {
        return noteMapper.selectList(
                        new LambdaQueryWrapper<GardenNote>()
                                .eq(GardenNote::getUserId, userId)
                                .orderByDesc(GardenNote::getCreatedAt))
                .stream().map(this::toVO).toList();
    }

    /** 浇水：每天最多一次，stage +1 封顶 3 */
    public GardenNoteVO water(Long userId, Long noteId) {
        GardenNote n = noteMapper.selectById(noteId);
        if (n == null || !userId.equals(n.getUserId())) {
            throw new BusinessException(404, "日记不存在");
        }
        LocalDateTime now = LocalDateTime.now();
        if (n.getLastWateredAt() != null && n.getLastWateredAt().toLocalDate().equals(now.toLocalDate())) {
            throw new BusinessException("今天已经浇过水了，明天再来");
        }
        if (n.getStage() == null || n.getStage() < 3) {
            n.setStage((n.getStage() == null ? 0 : n.getStage()) + 1);
        }
        n.setWaterCount((n.getWaterCount() == null ? 0 : n.getWaterCount()) + 1);
        n.setLastWateredAt(now);
        noteMapper.updateById(n);
        return toVO(n);
    }

    /**
     * 移植到广场：把私人日记转成公开 Post。
     * 已移植的不能重复移植（idempotent via transplantedPostId != null）。
     */
    public Long transplant(Long userId, Long noteId, boolean anonymous) {
        GardenNote n = noteMapper.selectById(noteId);
        if (n == null || !userId.equals(n.getUserId())) {
            throw new BusinessException(404, "日记不存在");
        }
        if (n.getTransplantedPostId() != null) {
            return n.getTransplantedPostId();  // 已移植，返回原 postId
        }
        CreatePostRequest postReq = new CreatePostRequest();
        postReq.setContent(n.getContent());
        postReq.setMood(n.getMood());
        postReq.setIsAnonymous(anonymous);
        postReq.setPostType(0);
        Long postId = postService.create(userId, postReq);
        n.setTransplantedPostId(postId);
        noteMapper.updateById(n);
        return postId;
    }

    public void deleteNote(Long userId, Long noteId) {
        GardenNote n = noteMapper.selectById(noteId);
        if (n == null || !userId.equals(n.getUserId())) {
            throw new BusinessException(404, "日记不存在");
        }
        noteMapper.deleteById(noteId);
    }

    // ============================================================
    // 内部工具
    // ============================================================

    /**
     * 每日自动生长：用户首次打开花园时，给所有未盛开植物 +1 stage。
     * <p>
     * 语义：lastWateredAt 表示「上次 stage 变化时间」（无论自动生长还是手动浇水）。
     * 这样能正确防止一天内多次访问导致飞速生长（V2 修复 bug 1）。
     * <p>
     * 副作用：用户今天自动生长后就不能再手动浇水（合理：植物今天已经长过）。
     */
    private void dailyAutoGrow(Long userId) {
        List<GardenNote> growing = noteMapper.selectList(
                new LambdaQueryWrapper<GardenNote>()
                        .eq(GardenNote::getUserId, userId)
                        .lt(GardenNote::getStage, 3));
        if (growing.isEmpty()) return;

        LocalDate today = LocalDate.now();
        for (GardenNote n : growing) {
            LocalDate lastAction = n.getLastWateredAt() == null
                    ? n.getCreatedAt().toLocalDate()
                    : n.getLastWateredAt().toLocalDate();
            if (lastAction.isBefore(today)) {
                n.setStage((n.getStage() == null ? 0 : n.getStage()) + 1);
                // 自动生长也更新 lastWateredAt，避免一天内多次访问飞速生长
                // 不增加 waterCount（water_count 表示用户主动浇水的次数）
                n.setLastWateredAt(LocalDateTime.now());
                noteMapper.updateById(n);
            }
        }
    }

    private GardenNoteVO toVO(GardenNote n) {
        GardenNoteVO vo = new GardenNoteVO();
        vo.setId(n.getId());
        vo.setContent(n.getContent());
        vo.setMood(n.getMood());
        vo.setStage(n.getStage());
        vo.setWaterCount(n.getWaterCount());
        vo.setLastWateredAt(n.getLastWateredAt());
        vo.setTransplanted(n.getTransplantedPostId() != null);
        vo.setPostId(n.getTransplantedPostId());
        vo.setCreatedAt(n.getCreatedAt());

        // 今天是否还能浇水
        LocalDateTime last = n.getLastWateredAt();
        LocalDate lastDate = last == null ? null : last.toLocalDate();
        vo.setCanWater(lastDate == null || !lastDate.equals(LocalDate.now()));
        vo.setCanTransplant(n.getTransplantedPostId() == null);
        return vo;
    }
}
