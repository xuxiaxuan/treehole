package com.xxx.treehole.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xxx.treehole.entity.Report;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 举报表 Mapper。
 */
public interface ReportMapper extends BaseMapper<Report> {

    /**
     * 统计某用户被举报总数（聚合其名下所有帖子的举报数）。
     */
    @Select("SELECT COUNT(1) FROM reports r JOIN posts p ON r.post_id = p.id WHERE p.user_id = #{userId}")
    long countByPostAuthor(@Param("userId") Long userId);
}
