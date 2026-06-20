-- V3：为 users 表追加生日字段（可选）
-- 用于 AI 塔罗抽牌：根据生日算星座，结合日期给 LLM 抽牌参考
-- 不强制填写，未填则塔罗抽牌走 question + 日期 作为依据

ALTER TABLE users
    ADD COLUMN birthday DATE NULL COMMENT '生日（可选，用于 AI 塔罗抽牌的星座推算）' AFTER nickname;
