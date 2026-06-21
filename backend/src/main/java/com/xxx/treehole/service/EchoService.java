package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.dto.echo.EchoClusterDetailVO;
import com.xxx.treehole.dto.echo.EchoClusterSummaryVO;
import com.xxx.treehole.dto.echo.EchoLetterVO;
import com.xxx.treehole.dto.echo.EchoRoomVO;
import com.xxx.treehole.dto.echo.WriteLetterRequest;
import com.xxx.treehole.dto.post.PostVO;
import com.xxx.treehole.entity.EchoCluster;
import com.xxx.treehole.entity.EchoClusterMember;
import com.xxx.treehole.entity.EchoLetter;
import com.xxx.treehole.entity.Post;
import com.xxx.treehole.mapper.EchoClusterMapper;
import com.xxx.treehole.mapper.EchoClusterMemberMapper;
import com.xxx.treehole.mapper.EchoLetterMapper;
import com.xxx.treehole.mapper.PostMapper;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.ai.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 共鸣信号业务：
 * <ol>
 *   <li>{@link #scan()} — 每晚定时聚类：拉过去 24h 帖子 → embed → 层次聚类 → AI 摘要 → 入库</li>
 *   <li>{@link #todayBanner()} — 首页 Banner：今日是否有共鸣</li>
 *   <li>{@link #clusterDetail(Long)} — 单个共鸣房间详情</li>
 *   <li>{@link #listByDate(LocalDate)} — 某日所有共鸣</li>
 * </ol>
 * <p>
 * 算法选择：单链接层次聚类 + 阈值过滤（不引入第三方 ML 库，KISS）。
 * <ul>
 *   <li>embedding 失败的帖子直接跳过，不参与聚类（fail-open）</li>
 *   <li>同作者多帖可归入同 cluster，但 cluster 内必须有 ≥2 个不同用户才算"共鸣"</li>
 *   <li>避免大 cluster：单 cluster 上限 20 帖，超出的保留相似度最高的前 20</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EchoService {

    /** 余弦相似度阈值：>= 0.75 视为相关（感性调参，nomic-embed-text 中文表现良好） */
    private static final double SIMILARITY_THRESHOLD = 0.75;

    /** 单 cluster 最少不同用户数 */
    private static final int MIN_DISTINCT_USERS = 2;

    /** 单 cluster 最大成员数（防止超大 cluster 污染） */
    private static final int MAX_CLUSTER_SIZE = 20;

    /** 一次扫描处理的帖子上限（避免大广场冷启动 OOM） */
    private static final int SCAN_BATCH = 500;

    /** 单次扫描最多产生的 cluster 数 */
    private static final int MAX_CLUSTERS_PER_DAY = 10;

    private final PostMapper postMapper;
    private final EchoClusterMapper clusterMapper;
    private final EchoClusterMemberMapper memberMapper;
    private final EchoLetterMapper letterMapper;
    private final PostService postService;
    private final AiService aiService;

    // ============================================================
    // 定时任务
    // ============================================================

    /**
     * 每晚 03:00 跑一次：聚类昨日帖子。
     * cron = "0 0 3 * * *"（秒0 分0 时3 任意日 任意月 任意周）
     * <p>
     * 单实例足够（v1）。多实例下用 ShedLock 或分布式锁。
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void scan() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.minusHours(24);

        List<Post> recent = postMapper.selectList(
                new LambdaQueryWrapper<Post>()
                        .eq(Post::getStatus, 0)
                        .ge(Post::getCreatedAt, start)
                        .lt(Post::getCreatedAt, now)
                        .orderByAsc(Post::getCreatedAt)
                        .last("LIMIT " + SCAN_BATCH));

        if (recent.size() < MIN_DISTINCT_USERS) {
            log.info("Echo scan: only {} posts in 24h, skip", recent.size());
            return;
        }

        // 1. 计算每帖 embedding（失败的剔除）
        List<PostWithVector> items = new ArrayList<>();
        for (Post p : recent) {
            String text = p.getContent();
            if (text == null || text.length() < 5) continue;  // 过短的没语义
            float[] vec = aiService.embed(text);
            if (vec != null && vec.length > 0) {
                items.add(new PostWithVector(p, vec));
            }
        }
        if (items.size() < MIN_DISTINCT_USERS) {
            log.info("Echo scan: only {} valid embeddings, skip", items.size());
            return;
        }

        // 2. 层次聚类：单链接 + 阈值
        List<List<PostWithVector>> clusters = hierarchicalCluster(items);

        // 3. 过滤 + 入库
        LocalDate clusterDate = now.toLocalDate().minusDays(1);  // 归属昨日
        int savedClusters = 0;
        int savedMembers = 0;
        // 先清除当日已有的（避免重复扫描堆积）
        clearExistingForDate(clusterDate);

        for (List<PostWithVector> cluster : clusters) {
            if (cluster.size() < MIN_DISTINCT_USERS) continue;
            // 去重 distinct users
            Set<Long> users = new HashSet<>();
            for (PostWithVector pwv : cluster) users.add(pwv.post.getUserId());
            if (users.size() < MIN_DISTINCT_USERS) continue;

            // 取前 N 条做摘要
            List<String> samples = cluster.stream()
                    .limit(10)
                    .map(pwv -> pwv.post.getContent())
                    .toList();
            String summary = aiService.echoSummary(samples);
            if (summary == null || summary.isBlank()) {
                summary = "昨夜的回响";  // 兜底
            }
            // 清洗 + 限长
            summary = sanitizeSummary(summary);

            EchoCluster ec = new EchoCluster();
            ec.setClusterDate(clusterDate);
            ec.setSummary(summary);
            ec.setMemberCount(cluster.size());
            try {
                clusterMapper.insert(ec);
            } catch (org.springframework.dao.DuplicateKeyException e) {
                // 同日同主题已存在（理论上前面 clearExistingForDate 已删），幂等跳过
                continue;
            }

            for (PostWithVector pwv : cluster) {
                EchoClusterMember m = new EchoClusterMember();
                m.setClusterId(ec.getId());
                m.setPostId(pwv.post.getId());
                m.setUserId(pwv.post.getUserId());
                memberMapper.insert(m);
                savedMembers++;
            }
            savedClusters++;
            if (savedClusters >= MAX_CLUSTERS_PER_DAY) break;
        }
        log.info("Echo scan done: {} posts → {} embeddings → {} clusters, {} members saved",
                recent.size(), items.size(), savedClusters, savedMembers);
    }

    /**
     * 清除某日的所有 cluster + 成员（重复扫描时先清理）。
     * 级联删除需要两次 SQL，MyBatis-Plus 没有 @OnDelete cascade。
     */
    private void clearExistingForDate(LocalDate date) {
        List<EchoCluster> existing = clusterMapper.selectList(
                new LambdaQueryWrapper<EchoCluster>().eq(EchoCluster::getClusterDate, date));
        if (existing.isEmpty()) return;
        List<Long> ids = existing.stream().map(EchoCluster::getId).toList();
        memberMapper.delete(new LambdaQueryWrapper<EchoClusterMember>()
                .in(EchoClusterMember::getClusterId, ids));
        clusterMapper.deleteBatchIds(ids);
    }

    // ============================================================
    // 用户端查询
    // ============================================================

    /**
     * 今日 Banner：展示昨日最新的几个共鸣。
     */
    public EchoRoomVO todayBanner() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<EchoCluster> clusters = clusterMapper.selectList(
                new LambdaQueryWrapper<EchoCluster>()
                        .eq(EchoCluster::getClusterDate, yesterday)
                        .orderByDesc(EchoCluster::getMemberCount)
                        .last("LIMIT 6"));
        return buildRoomVO(clusters, yesterday);
    }

    /** 按日期列出所有共鸣 */
    public EchoRoomVO listByDate(LocalDate date) {
        List<EchoCluster> clusters = clusterMapper.selectList(
                new LambdaQueryWrapper<EchoCluster>()
                        .eq(EchoCluster::getClusterDate, date)
                        .orderByDesc(EchoCluster::getMemberCount));
        return buildRoomVO(clusters, date);
    }

    /** 单个共鸣房间详情：含所有成员帖子 */
    public EchoClusterDetailVO clusterDetail(Long clusterId) {
        EchoCluster c = clusterMapper.selectById(clusterId);
        if (c == null) return null;

        List<EchoClusterMember> members = memberMapper.selectList(
                new LambdaQueryWrapper<EchoClusterMember>()
                        .eq(EchoClusterMember::getClusterId, clusterId));
        List<PostVO> postVOs;
        if (members.isEmpty()) {
            postVOs = List.of();
        } else {
            List<Long> postIds = members.stream().map(EchoClusterMember::getPostId).toList();
            List<Post> posts = postMapper.selectBatchIds(postIds);
            Map<Long, Post> postMap = new HashMap<>();
            for (Post p : posts) postMap.put(p.getId(), p);
            postVOs = postService.toVOList(members.stream()
                    .map(m -> postMap.get(m.getPostId()))
                    .filter(java.util.Objects::nonNull)
                    .filter(p -> p.getStatus() != null && p.getStatus() == 0)
                    .toList());
        }
        return EchoClusterDetailVO.from(c, postVOs, isArchived(c), isRevealed(c));
    }

    /**
     * 当前登录用户是否出现在昨日某 cluster 里（前端 Banner 高亮）。
     */
    public boolean isUserInCluster(Long userId, Long clusterId) {
        if (userId == null) return false;
        Long c = memberMapper.selectCount(
                new LambdaQueryWrapper<EchoClusterMember>()
                        .eq(EchoClusterMember::getClusterId, clusterId)
                        .eq(EchoClusterMember::getUserId, userId));
        return c != null && c > 0;
    }

    // ============================================================
    // 匿名信件（房间内互动）
    // ============================================================

    /**
     * 写信：每用户每房间最多 1 封；房间必须开放（未归档）；
     * 必须是房间成员才能写。
     * 揭信时间 = 房间 cluster_date 次日 22:00（即"今晚 22:00 揭信"）。
     */
    public Long writeLetter(Long userId, Long clusterId, WriteLetterRequest req) {
        EchoCluster cluster = clusterMapper.selectById(clusterId);
        if (cluster == null) {
            throw new BusinessException(404, "共鸣房间不存在");
        }
        if (isArchived(cluster)) {
            throw new BusinessException("房间已归档，不能再写信");
        }
        // 必须是房间成员
        Long in = memberMapper.selectCount(
                new LambdaQueryWrapper<EchoClusterMember>()
                        .eq(EchoClusterMember::getClusterId, clusterId)
                        .eq(EchoClusterMember::getUserId, userId));
        if (in == null || in <= 0) {
            throw new BusinessException(403, "只有房间成员能写信");
        }
        // 每人每房间 1 封
        Long exists = letterMapper.selectCount(
                new LambdaQueryWrapper<EchoLetter>()
                        .eq(EchoLetter::getClusterId, clusterId)
                        .eq(EchoLetter::getFromUserId, userId));
        if (exists != null && exists > 0) {
            throw new BusinessException("你已经写过一封了，等 22:00 揭信");
        }

        EchoLetter letter = new EchoLetter();
        letter.setClusterId(clusterId);
        letter.setFromUserId(userId);
        letter.setContent(req.getContent());
        letter.setRevealed(0);
        // 揭信时间：cluster_date 次日 22:00（cluster_date 是昨日，揭信时间是今天 22:00）
        letter.setRevealedAt(cluster.getClusterDate().plusDays(1).atTime(22, 0));
        try {
            letterMapper.insert(letter);
        } catch (org.springframework.dao.DuplicateKeyException e) {
            // 并发下另一请求已写入（V14 唯一约束兜底）
            throw new BusinessException("你已经写过一封了，等 22:00 揭信");
        }
        return letter.getId();
    }

    /**
     * 查房间的所有信件：
     * - 已揭信：所有信件 content 可见
     * - 未揭信：只返回自己的信件 content；他人信件 content 留空（前端显示"封缄中"）
     * - 永远不返回他人的 fromUserId（匿名）
     * - 未登录访问：只看到"已揭信"的 content，自己的 mine=false
     */
    public List<EchoLetterVO> listLetters(Long userId, Long clusterId) {
        EchoCluster cluster = clusterMapper.selectById(clusterId);
        if (cluster == null) return List.of();
        boolean revealed = isRevealed(cluster);

        List<EchoLetter> all = letterMapper.selectList(
                new LambdaQueryWrapper<EchoLetter>()
                        .eq(EchoLetter::getClusterId, clusterId)
                        .orderByAsc(EchoLetter::getCreatedAt));
        return all.stream().map(l -> {
            EchoLetterVO vo = new EchoLetterVO();
            vo.setId(l.getId());
            vo.setMine(userId != null && l.getFromUserId() != null && l.getFromUserId().equals(userId));
            vo.setCreatedAt(l.getCreatedAt());
            vo.setRevealedAt(l.getRevealedAt());
            vo.setRevealed(revealed);
            // 揭信后 或 自己写的信 才返回 content
            if (revealed || Boolean.TRUE.equals(vo.getMine())) {
                vo.setContent(l.getContent());
            } else {
                vo.setContent(null);  // 封缄
            }
            return vo;
        }).toList();
    }

    /** 房间是否归档：archived=1 或 cluster_date 已过 48h（保险） */
    private boolean isArchived(EchoCluster c) {
        if (c.getArchived() != null && c.getArchived() == 1) return true;
        // 双保险：cluster_date + 2 天视为归档（即使 archived 字段没更新）
        return c.getClusterDate().plusDays(2).isBefore(LocalDate.now());
    }

    /** 房间是否已到揭信时间：now >= cluster_date 次日 22:00 */
    private boolean isRevealed(EchoCluster c) {
        LocalDateTime revealAt = c.getClusterDate().plusDays(1).atTime(22, 0);
        return LocalDateTime.now().isAfter(revealAt);
    }

    /**
     * 揭信定时任务：每天 22:05 跑一次。
     * 把今天到时的信件标记 revealed=1。
     * 表达式含义：分 5 时 22 任意日 任意月 任意周。
     */
    @Scheduled(cron = "0 5 22 * * *")
    public void revealLetters() {
        LocalDateTime now = LocalDateTime.now();
        // 所有 revealed=0 且 revealedAt <= now 的信件
        List<EchoLetter> due = letterMapper.selectList(
                new LambdaQueryWrapper<EchoLetter>()
                        .eq(EchoLetter::getRevealed, 0)
                        .le(EchoLetter::getRevealedAt, now));
        if (due.isEmpty()) return;
        for (EchoLetter l : due) {
            l.setRevealed(1);
            letterMapper.updateById(l);
        }
        log.info("Echo letters revealed: {} letters", due.size());
    }

    /**
     * 归档定时任务：每天 04:00 跑一次。
     * 把 cluster_date 早于昨日的房间标记 archived=1。
     * 表达式含义：分 0 时 4 任意日 任意月 任意周。
     */
    @Scheduled(cron = "0 0 4 * * *")
    public void archiveOldClusters() {
        LocalDate cutoff = LocalDate.now().minusDays(1);
        List<EchoCluster> old = clusterMapper.selectList(
                new LambdaQueryWrapper<EchoCluster>()
                        .lt(EchoCluster::getClusterDate, cutoff)
                        .ne(EchoCluster::getArchived, 1));
        if (old.isEmpty()) return;
        for (EchoCluster c : old) {
            c.setArchived(1);
            clusterMapper.updateById(c);
        }
        log.info("Echo clusters archived: {} clusters", old.size());
    }

    // ============================================================
    // 聚类算法（包内可见，便于单测）
    // ============================================================

    /**
     * 单链接层次聚类：相似度 >= {@link #SIMILARITY_THRESHOLD} 的两个帖子归同簇。
     * 简单 O(n²) 实现，SCAN_BATCH=500 时 12.5w 次比较，性能可接受。
     */
    static List<List<PostWithVector>> hierarchicalCluster(List<PostWithVector> items) {
        int n = items.size();
        // union-find
        int[] parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (find(parent, i) == find(parent, j)) continue;
                double sim = cosine(items.get(i).vector, items.get(j).vector);
                if (sim >= SIMILARITY_THRESHOLD) {
                    union(parent, i, j);
                }
            }
        }
        // 收集
        Map<Integer, List<PostWithVector>> groups = new java.util.LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            int root = find(parent, i);
            groups.computeIfAbsent(root, k -> new ArrayList<>()).add(items.get(i));
        }
        // 过滤单帖簇
        return groups.values().stream()
                .filter(g -> g.size() >= 2)
                .sorted((a, b) -> Integer.compare(b.size(), a.size()))
                .map(g -> g.size() > MAX_CLUSTER_SIZE ? g.subList(0, MAX_CLUSTER_SIZE) : g)
                .toList();
    }

    private static int find(int[] parent, int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    private static void union(int[] parent, int a, int b) {
        int ra = find(parent, a), rb = find(parent, b);
        if (ra != rb) parent[ra] = rb;
    }

    /** 余弦相似度：两向量必须同长度 */
    static double cosine(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length || a.length == 0) return 0;
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            na += (double) a[i] * a[i];
            nb += (double) b[i] * b[i];
        }
        if (na <= 0 || nb <= 0) return 0;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    /** 摘要清洗：去引号、换行、限长 30 字 */
    static String sanitizeSummary(String s) {
        String cleaned = s.trim()
                .replaceAll("^[「\"']+|[」\"']+$", "")
                .replaceAll("[\\r\\n]", "")
                .trim();
        return cleaned.length() > 30 ? cleaned.substring(0, 30) : cleaned;
    }

    private EchoRoomVO buildRoomVO(List<EchoCluster> clusters, LocalDate date) {
        Long curUserId = null;
        try {
            curUserId = SecurityUtils.currentUserId();
        } catch (Exception ignored) {
        }

        EchoRoomVO room = new EchoRoomVO();
        room.setDate(date);
        room.setTotalCount(clusters.size());
        List<EchoClusterSummaryVO> list = new ArrayList<>();
        for (EchoCluster c : clusters) {
            EchoClusterSummaryVO vo = EchoClusterSummaryVO.from(c);
            if (curUserId != null) {
                vo.setMine(isUserInCluster(curUserId, c.getId()));
            } else {
                vo.setMine(false);
            }
            list.add(vo);
        }
        room.setClusters(list);
        return room;
    }

    /** 内部用：post + 它的 embedding */
    record PostWithVector(Post post, float[] vector) {}
}
