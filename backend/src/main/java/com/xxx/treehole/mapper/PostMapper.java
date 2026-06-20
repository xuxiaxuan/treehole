package com.xxx.treehole.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xxx.treehole.entity.Post;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 帖子表 Mapper。
 */
public interface PostMapper extends BaseMapper<Post> {

    /**
     * 统计某用户收到点赞总数（所有正常帖 like_count 求和）。
     */
    @Select("SELECT COALESCE(SUM(like_count), 0) FROM posts WHERE user_id = #{userId}")
    long sumLikeCountByUserId(@Param("userId") Long userId);

    /**
     * 统计某用户发帖总数（含所有状态，管理端/个人中心均需要真实数字）。
     */
    @Select("SELECT COUNT(1) FROM posts WHERE user_id = #{userId}")
    long countByUserId(@Param("userId") Long userId);
}
