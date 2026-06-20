package com.xxx.treehole.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxx.treehole.common.JwtUtil;
import com.xxx.treehole.dto.auth.RegisterRequest;
import com.xxx.treehole.dto.post.CreatePostRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 举报接口测试。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    void createReport() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("rep1@example.com");
        reg.setPassword("password123");
        reg.setNickname("rep");
        MvcResult r = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(reg)))
                .andExpect(status().isOk())
                .andReturn();
        Long userId = om.readTree(r.getResponse().getContentAsString())
                .get("data").get("user").get("id").asLong();
        String token = "Bearer " + jwtUtil.generateToken(userId, 0);

        CreatePostRequest p = new CreatePostRequest();
        p.setContent("bad post");
        MvcResult pr = mockMvc.perform(post("/api/posts")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(p)))
                .andExpect(status().isOk())
                .andReturn();
        Long postId = om.readTree(pr.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        Map<String, Object> body = Map.of("postId", postId, "reason", "辱骂");
        mockMvc.perform(post("/api/reports")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").isNumber());
    }
}
