package com.xxx.treehole.service.ai;

import java.util.List;

/**
 * LLM 摘要 + 标签结果。
 */
public record SummarizeResult(String summary, List<String> tags) {
}
