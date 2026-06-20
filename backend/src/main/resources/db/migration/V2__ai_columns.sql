-- V2：为 posts 表追加 AI 字段
-- ai_summary：管理员触发的 LLM 帖子摘要（≤500 字）
-- ai_tags：逗号分隔的标签字符串（≤128 字），每条 1-3 个标签
-- 1:1 反范式存储，避免新增 summary 表（YAGNI）

ALTER TABLE posts
    ADD COLUMN ai_summary VARCHAR(500) NULL COMMENT 'AI 生成的帖子摘要（管理员触发，按需缓存）' AFTER content,
    ADD COLUMN ai_tags    VARCHAR(128) NULL COMMENT 'AI 生成的标签，逗号分隔' AFTER ai_summary;
