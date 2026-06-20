package com.xxx.treehole.dto.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 举报请求。
 */
@Data
public class CreateReportRequest {

    @NotNull
    private Long postId;

    @NotBlank
    @Size(max = 256)
    private String reason;
}
