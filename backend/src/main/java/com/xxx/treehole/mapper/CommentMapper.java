package com.xxx.treehole.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xxx.treehole.entity.Comment;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CommentMapper extends BaseMapper<Comment> {
}
