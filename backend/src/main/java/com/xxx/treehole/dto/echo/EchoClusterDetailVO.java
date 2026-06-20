package com.xxx.treehole.dto.echo;

import com.xxx.treehole.dto.post.PostVO;
import com.xxx.treehole.entity.EchoCluster;
import lombok.Data;

import java.util.List;

/**
 * 共鸣房间详情：含 cluster 元信息 + 全部成员帖子（匿名化处理同 PostService.toVO）。
 * <p>
 * archived：房间是否归档（24h 后只读）
 * revealed：信件是否已揭封（22:00 后）
 */
@Data
public class EchoClusterDetailVO {

    private Long id;
    private java.time.LocalDate date;
    private String summary;
    private Integer memberCount;
    private Boolean archived;
    private Boolean revealed;
    private List<PostVO> posts;

    public static EchoClusterDetailVO from(EchoCluster c, List<PostVO> posts, boolean archived, boolean revealed) {
        EchoClusterDetailVO vo = new EchoClusterDetailVO();
        vo.setId(c.getId());
        vo.setDate(c.getClusterDate());
        vo.setSummary(c.getSummary());
        vo.setMemberCount(c.getMemberCount());
        vo.setArchived(archived);
        vo.setRevealed(revealed);
        vo.setPosts(posts);
        return vo;
    }
}
