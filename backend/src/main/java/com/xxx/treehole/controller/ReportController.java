package com.xxx.treehole.controller;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.report.CreateReportRequest;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 举报接口。
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public Result<Map<String, Long>> create(@Valid @RequestBody CreateReportRequest req) {
        Long userId = SecurityUtils.currentUserId();
        Long id = reportService.create(userId, req);
        return Result.success(Map.of("id", id));
    }
}
