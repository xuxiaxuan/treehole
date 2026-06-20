package com.xxx.treehole.init;

import com.xxx.treehole.entity.User;
import com.xxx.treehole.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

/**
 * 仅 test/dev profile 启用的初始化器：确保有一个默认管理员账号便于端到端联调。
 * 生产环境不会加载（YAGNI + 安全考虑）。
 *
 * 默认账号：admin@example.com / admin123
 */
@Slf4j
@Component
@Profile({"test", "dev"})
@RequiredArgsConstructor
public class TestDataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String adminEmail = "admin@example.com";
        Long existing = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getEmail, adminEmail));
        if (existing != null && existing > 0) {
            return;
        }
        User admin = new User();
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setNickname("管理员");
        admin.setRole(1);
        admin.setStatus(0);
        userMapper.insert(admin);
        log.info("Default admin account created: {} (pwd: admin123)", adminEmail);
    }
}
