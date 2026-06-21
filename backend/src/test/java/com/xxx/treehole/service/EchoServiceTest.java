package com.xxx.treehole.service;

import com.xxx.treehole.entity.Post;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * EchoService 聚类算法单测：通过反射调 package-private static 方法，
 * 避免 mock Spring 容器和 EmbeddingModel 依赖。
 * <p>
 * 覆盖：
 * <ul>
 *   <li>{@code cosine} 余弦相似度边界值</li>
 *   <li>{@code hierarchicalCluster} union-find 聚类正确性</li>
 *   <li>{@code sanitizeSummary} 清洗逻辑（引号、换行、限长）</li>
 * </ul>
 */
class EchoServiceTest {

    // ============================================================
    // cosine
    // ============================================================

    @Test
    void cosine_identicalVectors_returns1() throws Exception {
        assertEquals(1.0, cosine(new float[]{1, 0, 0}, new float[]{1, 0, 0}), 1e-6);
    }

    @Test
    void cosine_orthogonalVectors_returns0() throws Exception {
        assertEquals(0.0, cosine(new float[]{1, 0}, new float[]{0, 1}), 1e-6);
    }

    @Test
    void cosine_oppositeVectors_returnsMinus1() throws Exception {
        assertEquals(-1.0, cosine(new float[]{1, 1}, new float[]{-1, -1}), 1e-6);
    }

    @Test
    void cosine_differentLength_returns0() throws Exception {
        assertEquals(0.0, cosine(new float[]{1, 2, 3}, new float[]{1, 2}), 1e-6);
    }

    @Test
    void cosine_zeroVector_returns0() throws Exception {
        assertEquals(0.0, cosine(new float[]{0, 0, 0}, new float[]{1, 2, 3}), 1e-6);
        assertEquals(0.0, cosine(null, new float[]{1, 2, 3}), 1e-6);
    }

    @Test
    void cosine_60Degrees_returns0_5() throws Exception {
        // 60 度夹角 cos = 0.5
        float cos = (float) cosine(new float[]{1, 0}, new float[]{0.5f, (float) Math.sqrt(3) / 2});
        assertEquals(0.5, cos, 1e-3);
    }

    // ============================================================
    // hierarchicalCluster
    // ============================================================

    @Test
    void cluster_singleItem_returnsEmpty() throws Exception {
        List<Object> items = List.of(pwv("a", new float[]{1, 0}));
        List<List<Object>> clusters = hierarchicalCluster(items);
        assertTrue(clusters.isEmpty(), "单元素不应形成聚类");
    }

    @Test
    void cluster_twoSimilarItems_grouped() throws Exception {
        // 两个向量完全相同，相似度 = 1.0 >= 0.75
        List<Object> items = List.of(
                pwv("a", new float[]{1, 0}),
                pwv("b", new float[]{1, 0}));
        List<List<Object>> clusters = hierarchicalCluster(items);
        assertEquals(1, clusters.size(), "两个相似项应聚为 1 簇");
        assertEquals(2, clusters.get(0).size());
    }

    @Test
    void cluster_threeItemsChain_singleBigCluster() throws Exception {
        // 链式：a~b 相似，b~c 相似，a~c 不相似 → 单链接 union-find 让三者聚为一簇
        // 用近似向量保证 union-find 串联：a=[1,0], b=[0.9,0.44]（cos≈0.9）, c=[0.8,0.6]（cos≈0.93）
        List<Object> items = List.of(
                pwv("a", new float[]{1, 0}),
                pwv("b", new float[]{0.9f, 0.44f}),
                pwv("c", new float[]{0.8f, 0.6f}));
        List<List<Object>> clusters = hierarchicalCluster(items);
        assertEquals(1, clusters.size(), "链式相似应单链接为一簇");
        assertEquals(3, clusters.get(0).size());
    }

    @Test
    void cluster_twoGroups_twoClusters() throws Exception {
        // 两组互不相似
        List<Object> items = List.of(
                pwv("a", new float[]{1, 0}),
                pwv("b", new float[]{1, 0}),
                pwv("c", new float[]{0, 1}),
                pwv("d", new float[]{0, 1}));
        List<List<Object>> clusters = hierarchicalCluster(items);
        assertEquals(2, clusters.size(), "两组互不相似应聚为 2 簇");
        // 每簇 size = 2
        assertEquals(2, clusters.get(0).size());
        assertEquals(2, clusters.get(1).size());
    }

    @Test
    void cluster_sortedBySizeDesc() throws Exception {
        List<Object> items = List.of(
                pwv("a", new float[]{1, 0}),
                pwv("b", new float[]{1, 0}),
                pwv("c", new float[]{1, 0}),
                pwv("d", new float[]{0, 1}),
                pwv("e", new float[]{0, 1}));
        List<List<Object>> clusters = hierarchicalCluster(items);
        assertEquals(2, clusters.size());
        assertTrue(clusters.get(0).size() >= clusters.get(1).size(),
                "应按簇大小降序");
    }

    @Test
    void cluster_emptyInput_returnsEmpty() throws Exception {
        assertTrue(hierarchicalCluster(List.of()).isEmpty());
    }

    // ============================================================
    // sanitizeSummary
    // ============================================================

    @Test
    void sanitize_stripsQuotesAndBrackets() throws Exception {
        assertEquals("深夜的孤独", sanitizeSummary("「深夜的孤独」"));
        assertEquals("深夜的孤独", sanitizeSummary("\"深夜的孤独\""));
    }

    @Test
    void sanitize_removesNewlines() throws Exception {
        assertEquals("abc", sanitizeSummary("a\r\nb\nc"));
    }

    @Test
    void sanitize_truncatesTo30() throws Exception {
        String longText = "这是一段非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的主题超过三十个字";
        String result = sanitizeSummary(longText);
        assertTrue(result.length() <= 30, "长度应 ≤30");
    }

    @Test
    void sanitize_trimsWhitespace() throws Exception {
        assertEquals("主题", sanitizeSummary("  主题  "));
    }

    @Test
    void sanitize_emptyString_staysEmpty() throws Exception {
        assertEquals("", sanitizeSummary(""));
    }

    // ============================================================
    // 反射辅助
    // ============================================================

    private static double cosine(float[] a, float[] b) throws Exception {
        Method m = EchoService.class.getDeclaredMethod("cosine", float[].class, float[].class);
        m.setAccessible(true);
        return (double) m.invoke(null, a, b);
    }

    @SuppressWarnings("unchecked")
    private static List<List<Object>> hierarchicalCluster(List<Object> items) throws Exception {
        // EchoService.PostWithVector 是包内 record，用反射构造
        Class<?> pwvClass = Class.forName("com.xxx.treehole.service.EchoService$PostWithVector");
        java.lang.reflect.Constructor<?> ctor = pwvClass.getDeclaredConstructors()[0];
        ctor.setAccessible(true);
        List<Object> typed = new java.util.ArrayList<>();
        for (Object o : items) typed.add(o);  // 已经是 PostWithVector
        Method m = EchoService.class.getDeclaredMethod("hierarchicalCluster", List.class);
        m.setAccessible(true);
        return (List<List<Object>>) m.invoke(null, typed);
    }

    /** 构造 PostWithVector：直接反射 record 构造器 */
    private static Object pwv(String content, float[] vector) throws Exception {
        Post p = new Post();
        p.setId(System.nanoTime());
        p.setContent(content);
        p.setUserId(1L);
        p.setStatus(0);
        Class<?> pwvClass = Class.forName("com.xxx.treehole.service.EchoService$PostWithVector");
        java.lang.reflect.Constructor<?> ctor = pwvClass.getDeclaredConstructors()[0];
        ctor.setAccessible(true);
        return ctor.newInstance(p, vector);
    }

    private static String sanitizeSummary(String input) throws Exception {
        Method m = EchoService.class.getDeclaredMethod("sanitizeSummary", String.class);
        m.setAccessible(true);
        return (String) m.invoke(null, input);
    }
}
