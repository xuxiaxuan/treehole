package com.xxx.treehole.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 共鸣成员：cluster 与 post 的多对一关系。
 * user_id 冗余便于"按用户查是否在某 cluster"。
 */
@Data
@TableName("echo_cluster_members")
public class EchoClusterMember {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long clusterId;

    private Long postId;

    private Long userId;
}
