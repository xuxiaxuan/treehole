package com.xxx.treehole.controller.admin;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 管理端接口测试：非管理员被拒、管理员可访问。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private JwtUtil jwtUtil;

    private String registerAndGetToken(String email, int role) throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail(email);
        reg.setPassword("password123");
        reg.setNickname(email);
        MvcResult r = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(reg)))
                .andExpect(status().isOk())
                .andReturn();
        Long userId = om.readTree(r.getResponse().getContentAsString())
                .get("data").get("user").get("id").asLong();
        return "Bearer " + jwtUtil.generateToken(userId, role);
    }

    @Test
    void nonAdminGets403() throws Exception {
        String token = registerAndGetToken("user1@example.com", 0);
        mockMvc.perform(get("/api/admin/posts").header("Authorization", token))
                .andExpect(jsonPath("$.code").value(403));
    }

    @Test
    void adminCanListPosts() throws Exception {
        String token = registerAndGetToken("admin1@example.com", 1);
        mockMvc.perform(get("/api/admin/posts").header("Authorization", token))
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void adminCanListUsers() throws Exception {
        String token = registerAndGetToken("admin2@example.com", 1);
        mockMvc.perform(get("/api/admin/users").header("Authorization", token))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.list").isArray());
    }
}
