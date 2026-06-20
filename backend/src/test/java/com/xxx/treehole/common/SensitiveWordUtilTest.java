package com.xxx.treehole.common;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * SensitiveWordUtil 单测（不依赖 Spring，直接构造）。
 */
class SensitiveWordUtilTest {

    private SensitiveWordUtil util;

    @BeforeEach
    void setUp() {
        util = new SensitiveWordUtil(Set.of("敏感词", "违禁", "广告"));
    }

    @Test
    void detectsSensitiveWord() {
        var hit = util.check("这有个敏感词");
        assertTrue(hit.isPresent());
        assertEquals("敏感词", hit.get());
    }

    @Test
    void passesCleanText() {
        assertTrue(util.check("这是一段正常文字").isEmpty());
    }

    @Test
    void detectsMultiple() {
        var hits = util.checkAll("广告和违禁");
        assertEquals(2, hits.size());
    }
}
