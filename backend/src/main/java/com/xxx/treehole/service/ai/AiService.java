package com.xxx.treehole.service.ai;

import java.time.LocalDate;
import java.util.List;

/**
 * AI 能力门面：业务层只依赖此接口，不感知具体 LLM provider。
 * 能力：塔罗抽牌 / 塔罗解读 / 内容审核 / 树洞温暖回复 / 帖子摘要标签。
 * <p>
 * 契约：
 * - 实现需自行吞掉 LLM 调用异常，失败时返回 null（业务层做兜底）
 * - 启用开关 {@code ai.enabled} 决定走 Ollama 实现还是 Noop 实现
 */
public interface AiService {

    /**
     * AI 每日运势：基于星座 + 今日日期生成 1 段运势文本。
     * 失败返回 null，业务层走 fallback 文案。
     *
     * @param zodiac 星座中文（可空，未填生日时为 null，走通用运势）
     * @param date   今日日期
     * @return 运势文本；失败/null 由业务层走 fallback
     */
    String dailyFortune(String zodiac, LocalDate date);

    /**
     * AI 塔罗抽牌：根据生日（推星座）+ 今日日期 + 用户问题，由 LLM 选中 3 张牌。
     *
     * @param birthDate 用户生日（可空）
     * @param zodiac    后端推算的星座中文（可空，birthDate 为空时为 null）
     * @param question  用户问题（可空）
     * @return 3 张牌的 cardId + 正逆位；失败/null 由业务层回退随机
     */
    TarotDrawResult drawTarotCards(LocalDate birthDate, String zodiac, String question);

    /**
     * 塔罗解读：基于抽到的牌（含正逆位）+ 用户问题生成中文解读。
     *
     * @param cards    抽到的牌列表（1-3 张）
     * @param question 用户问题（可空）
     * @return 解读文本；失败/null 由业务层走 fallback 文案
     */
    String interpretTarot(List<DrawnCard> cards, String question);

    /**
     * 内容审核：判断是否违规。
     *
     * @param content 用户提交的内容
     * @return 审核结果；失败/null 由业务层走 fail-open（放行）
     */
    ModerationResult moderatePost(String content);

    /**
     * 树洞温暖回复：生成共情短句。
     *
     * @param content 用户分享的树洞内容
     * @return 回复文本；失败/null 由业务层走 fallback 文案
     */
    String warmReply(String content);

    /**
     * 帖子摘要 + 标签。
     *
     * @param content 帖子内容
     * @return 摘要结果；失败/null 由业务层报 503
     */
    SummarizeResult summarize(String content);

    /**
     * 计算文本的 embedding 向量，用于共鸣信号聚类。
     * 失败返回 null，业务层走兜底（跳过该帖）。
     *
     * @param text 文本内容
     * @return float 数组；null 表示不可用
     */
    float[] embed(String text);

    /**
     * 共鸣信号主题摘要：基于多条帖子内容生成一句话主题。
     * 失败返回 null，业务层用"昨夜的回响"等兜底文案。
     *
     * @param samples 帖子样本（取前 N 条拼接）
     * @return 主题摘要；null 表示不可用
     */
    String echoSummary(java.util.List<String> samples);
}
