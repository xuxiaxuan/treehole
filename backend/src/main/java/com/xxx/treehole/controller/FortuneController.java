package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.fortune.DailyFortuneVO;
import com.xxx.treehole.service.FortuneService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 每日运势接口：登录可用。
 * 同一用户当日多次请求只生成一次（服务端缓存），次日自动失效。
 */
@RestController
@RequestMapping("/api/fortune")
@RequiredArgsConstructor
public class FortuneController {

    private final FortuneService fortuneService;

    @GetMapping("/today")
    public Result<DailyFortuneVO> today() {
        return Result.success(fortuneService.today());
    }
}
