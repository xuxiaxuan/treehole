package com.xxx.treehole.dto.echo;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * 共鸣房间视图（按日期聚合）：某日所有 cluster。
 */
@Data
public class EchoRoomVO {

    private LocalDate date;
    private Integer totalCount;
    private List<EchoClusterSummaryVO> clusters;
}
