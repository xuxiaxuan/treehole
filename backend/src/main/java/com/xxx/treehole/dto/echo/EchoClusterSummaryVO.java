package com.xxx.treehole.dto.echo;

import com.xxx.treehole.entity.EchoCluster;
import lombok.Data;

import java.time.LocalDate;

/**
 * 共鸣房间摘要（首页 Banner / 房间列表用）。
 */
@Data
public class EchoClusterSummaryVO {

    private Long id;
    private LocalDate date;
    private String summary;
    private Integer memberCount;
    /** 当前登录用户是否在该 cluster（前端高亮） */
    private Boolean mine;

    public static EchoClusterSummaryVO from(EchoCluster c) {
        EchoClusterSummaryVO vo = new EchoClusterSummaryVO();
        vo.setId(c.getId());
        vo.setDate(c.getClusterDate());
        vo.setSummary(c.getSummary());
        vo.setMemberCount(c.getMemberCount());
        vo.setMine(false);
        return vo;
    }
}
