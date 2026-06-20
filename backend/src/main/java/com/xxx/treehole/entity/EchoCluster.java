package com.xxx.treehole.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 共鸣聚类：每晚定时任务把过去 24h 相似帖子归到一起。
 */
@Data
@TableName("echo_clusters")
public class EchoCluster {

    @TableId(type = IdType.AUTO)
    private Long id;

    private LocalDate clusterDate;

    /** AI 生成的一句话主题摘要，如"对工作的迷茫与等待" */
    private String summary;

    private Integer memberCount;

    /** 0=开放 1=已归档（24h 后） */
    private Integer archived;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
