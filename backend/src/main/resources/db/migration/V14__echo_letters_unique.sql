-- V14：echo_letters 加唯一约束（防并发写信）
-- 场景：用户快速双击"寄出"按钮，select-then-insert 在并发下会插入两条。
-- 通过数据库唯一约束兜底，业务层 catch DuplicateKeyException 转友好提示。

ALTER TABLE echo_letters
    ADD UNIQUE KEY uk_user_cluster (from_user_id, cluster_id);
