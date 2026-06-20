package com.xxx.treehole.dto.story;

import lombok.Data;

import java.util.List;

@Data
public class StoryListVO {
    private List<StoryVO> list;
    private long total;
}
