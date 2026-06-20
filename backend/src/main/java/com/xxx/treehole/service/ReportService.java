package com.xxx.treehole.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.dto.report.CreateReportRequest;
import com.xxx.treehole.entity.Report;
import com.xxx.treehole.mapper.ReportMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * 举报业务。
 * 注入 PostService 用 @Lazy 避免 Bean 创建顺序问题（无循环依赖，纯保险）。
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportMapper reportMapper;

    @Lazy
    private final PostService postService;

    public Long create(Long reporterId, CreateReportRequest req) {
        Report r = new Report();
        r.setReporterId(reporterId);
        r.setPostId(req.getPostId());
        r.setReason(req.getReason());
        r.setStatus(0);
        reportMapper.insert(r);
        return r.getId();
    }

    public Map<String, Object> adminList(int page, int size, Integer status) {
        LambdaQueryWrapper<Report> q = new LambdaQueryWrapper<Report>()
                .orderByDesc(Report::getCreatedAt);
        if (status != null) {
            q.eq(Report::getStatus, status);
        }
        Page<Report> p = reportMapper.selectPage(new Page<>(page, size), q);
        return Map.of("list", p.getRecords(), "total", p.getTotal());
    }

    public void resolveReport(Long id, String action, Long postId) {
        Report r = reportMapper.selectById(id);
        if (r == null) {
            throw new BusinessException(404, "举报不存在");
        }
        r.setStatus(1);
        reportMapper.updateById(r);
        if ("delete_post".equals(action) && postId != null) {
            postService.updatePostStatus(postId, 2);
        }
    }
}
