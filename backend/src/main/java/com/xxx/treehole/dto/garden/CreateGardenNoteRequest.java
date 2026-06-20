package com.xxx.treehole.dto.garden;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 种下一颗心情种子：私人日记，不发广场。
 * 移植到广场是另一个独立操作（PATCH /api/garden/notes/{id}/transplant）。
 */
@Data
public class CreateGardenNoteRequest {

    @NotBlank
    @Size(max = 2000)
    private String content;

    @Pattern(regexp = "^(calm|sad|anxious|warm|grateful)?$", message = "心情值非法")
    private String mood;
}
