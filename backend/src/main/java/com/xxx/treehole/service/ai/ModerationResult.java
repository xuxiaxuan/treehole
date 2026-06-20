package com.xxx.treehole.service.ai;

/**
 * LLM 审核结果。
 * pass=true 表示放行；pass=false 表示违规，category/reason 给前端/审计用。
 */
public record ModerationResult(boolean pass, String category, String reason) {

    /** 放行的快捷工厂 */
    public static ModerationResult safe() {
        return new ModerationResult(true, "safe", "");
    }

    /** 违规的快捷工厂 */
    public static ModerationResult ofViolation(String category, String reason) {
        return new ModerationResult(false, category, reason);
    }
}
