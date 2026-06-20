package com.xxx.treehole.controller;

import com.xxx.treehole.common.BusinessException;
import com.xxx.treehole.common.Result;
import com.xxx.treehole.dto.echo.EchoClusterDetailVO;
import com.xxx.treehole.dto.echo.EchoLetterVO;
import com.xxx.treehole.dto.echo.EchoRoomVO;
import com.xxx.treehole.dto.echo.WriteLetterRequest;
import com.xxx.treehole.security.SecurityUtils;
import com.xxx.treehole.service.EchoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 共鸣信号接口：
 * <ul>
 *   <li>GET  /api/echo/today       → 昨夜共鸣 Banner（公开）</li>
 *   <li>GET  /api/echo?date=       → 某日所有共鸣（公开）</li>
 *   <li>GET  /api/echo/{clusterId} → 房间详情（公开）</li>
 *   <li>GET  /api/echo/{clusterId}/letters → 信件列表（需登录）</li>
 *   <li>POST /api/echo/{clusterId}/letters → 写信（需登录 + 房间成员）</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/echo")
@RequiredArgsConstructor
public class EchoController {

    private final EchoService echoService;

    @GetMapping("/today")
    public Result<EchoRoomVO> today() {
        return Result.success(echoService.todayBanner());
    }

    @GetMapping
    public Result<EchoRoomVO> byDate(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now().minusDays(1);
        return Result.success(echoService.listByDate(date));
    }

    @GetMapping("/{clusterId}")
    public Result<EchoClusterDetailVO> detail(@PathVariable Long clusterId) {
        EchoClusterDetailVO vo = echoService.clusterDetail(clusterId);
        if (vo == null) throw new BusinessException(404, "共鸣房间不存在");
        return Result.success(vo);
    }

    /** 信件列表：22:00 前他人信件封缄，22:00 后全部可见。未登录也能看（揭信后内容） */
    @GetMapping("/{clusterId}/letters")
    public Result<List<EchoLetterVO>> letters(@PathVariable Long clusterId) {
        Long userId;
        try {
            userId = SecurityUtils.currentUserId();
        } catch (Exception e) {
            userId = null;
        }
        return Result.success(echoService.listLetters(userId, clusterId));
    }

    /** 写信：每用户每房间 1 封，必须房间成员 */
    @PostMapping("/{clusterId}/letters")
    public Result<Map<String, Long>> writeLetter(
            @PathVariable Long clusterId,
            @Valid @RequestBody WriteLetterRequest req) {
        Long userId = SecurityUtils.currentUserId();
        Long id = echoService.writeLetter(userId, clusterId, req);
        return Result.success(Map.of("id", id));
    }
}

