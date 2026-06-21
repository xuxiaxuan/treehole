package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.stats.PlazaStatsVO;
import com.xxx.treehole.service.PlazaStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 公开统计接口（无需登录，脱敏聚合数据）。
 * - GET /api/stats/plaza → 首页统计概览
 */
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final PlazaStatsService plazaStatsService;

    @GetMapping("/plaza")
    public Result<PlazaStatsVO> plaza() {
        return Result.success(plazaStatsService.plaza());
    }
}
