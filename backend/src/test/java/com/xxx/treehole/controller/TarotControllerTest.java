package com.xxx.treehole.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 塔罗接口测试。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TarotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void deckReturns22MajorCards() throws Exception {
        mockMvc.perform(get("/api/tarot/deck"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.major").isArray())
                .andExpect(jsonPath("$.data.major.length()").value(22))
                .andExpect(jsonPath("$.data.minor.length()").value(4));
    }
}
