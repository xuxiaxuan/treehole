package com.xxx.treehole.controller.admin;

import com.xxx.treehole.common.Result;
import com.xxx.treehole.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 管理端举报接口。
 */
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping
    public Result<Map<String, Object>> list(@RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "20") int size,
                                            @RequestParam(required = false) Integer status) {
        return Result.success(reportService.adminList(page, size, status));
    }

    @PatchMapping("/{id}")
    public Result<Void> resolve(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String action = (String) body.get("action");
        Long postId = body.get("postId") == null ? null : ((Number) body.get("postId")).longValue();
        reportService.resolveReport(id, action, postId);
        return Result.success();
    }
}
