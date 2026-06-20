package com.xxx.treehole.common;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * JwtUtil 测试。
 */
@SpringBootTest
@ActiveProfiles("test")
class JwtUtilTest {

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    void generateAndParseToken() {
        String token = jwtUtil.generateToken(1L, 0);
        assertEquals(1L, jwtUtil.getUserId(token));
        assertEquals(0, jwtUtil.getRole(token));
        assertFalse(jwtUtil.isExpired(token));
    }

    @Test
    void invalidTokenReturnsNull() {
        assertNull(jwtUtil.getUserId("invalid.token.here"));
    }
}
