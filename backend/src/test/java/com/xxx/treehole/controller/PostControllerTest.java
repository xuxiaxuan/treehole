package com.xxx.treehole.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxx.treehole.common.JwtUtil;
import com.xxx.treehole.dto.auth.RegisterRequest;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 帖子接口测试：发帖 / 列表 / 详情 / 点赞。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 注册并返回 Bearer token，token 中的 userId 取自实际响应（避免硬编码）。
     */
    private String registerAndLogin(String email) throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail(email);
        reg.setPassword("password123");
        reg.setNickname(email);
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(reg)))
                .andExpect(status().isOk())
                .andReturn();
        Long userId = om.readTree(result.getResponse().getContentAsString())
                .get("data").get("user").get("id").asLong();
        return "Bearer " + jwtUtil.generateToken(userId, 0);
    }

    private Long createPost(String token, String content, boolean anonymous) throws Exception {
        Map<String, Object> body = Map.of("content", content, "isAnonymous", anonymous);
        MvcResult r = mockMvc.perform(post("/api/posts")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("data").get("id").asLong();
    }

    @Test
    void createPostSuccess() throws Exception {
        String token = registerAndLogin("post1@example.com");
        Map<String, Object> body = Map.of("content", "hello world", "isAnonymous", false);

        mockMvc.perform(post("/api/posts")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").isNumber());
    }

    @Test
    void createPostWithSensitiveWordFails() throws Exception {
        String token = registerAndLogin("post2@example.com");
        Map<String, Object> body = Map.of("content", "包含赌博的内容", "isAnonymous", true);

        mockMvc.perform(post("/api/posts")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.msg").value(org.hamcrest.Matchers.containsString("敏感词")));
    }

    @Test
    void createPostWithoutTokenFails() throws Exception {
        Map<String, Object> body = Map.of("content", "hello");
        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    void listPostsAnonymous() throws Exception {
        mockMvc.perform(get("/api/posts?page=1&size=10"))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.list").isArray())
                .andExpect(jsonPath("$.data.total").isNumber());
    }

    @Test
    void detailPost() throws Exception {
        String token = registerAndLogin("detail1@example.com");
        Long id = createPost(token, "detail content", false);

        mockMvc.perform(get("/api/posts/" + id))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.content").value("detail content"));
    }

    @Test
    void toggleLike() throws Exception {
        String token = registerAndLogin("like1@example.com");
        Long id = createPost(token, "to be liked", false);

        // 点赞
        mockMvc.perform(post("/api/posts/" + id + "/like").header("Authorization", token))
                .andExpect(jsonPath("$.data.liked").value(true))
                .andExpect(jsonPath("$.data.likeCount").value(1));

        // 取消
        mockMvc.perform(post("/api/posts/" + id + "/like").header("Authorization", token))
                .andExpect(jsonPath("$.data.liked").value(false))
                .andExpect(jsonPath("$.data.likeCount").value(0));
    }
}
