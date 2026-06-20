package com.xxx.treehole.dto.tarot;

import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * AI 抽牌请求。
 * birthDate 可空（未登录或未填生日时走 question+日期 依据）。
 * question 可空。
 */
@Data
public class TarotDrawRequest {

    /** 用户生日（可空）；后端据此推算星座传给 LLM */
    @PastOrPresent(message = "生日不能是未来日期")
    private LocalDate birthDate;

    @Size(max = 200, message = "问题最长 200 字")
    private String question;
}
