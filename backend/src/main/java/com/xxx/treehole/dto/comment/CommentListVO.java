package com.xxx.treehole.dto.comment;

import lombok.Data;

import java.util.List;

@Data
public class CommentListVO {
    private List<CommentVO> list;
    private long total;
}
