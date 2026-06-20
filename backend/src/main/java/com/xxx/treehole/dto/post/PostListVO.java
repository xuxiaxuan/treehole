package com.xxx.treehole.dto.post;

import lombok.Data;

import java.util.List;

/**
 * 帖子列表分页响应。
 */
@Data
public class PostListVO {

    private List<PostVO> list;
    private long total;
}
