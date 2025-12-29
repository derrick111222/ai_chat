-- 为 agents 表添加 Eino 工作流相关字段的迁移脚本
-- 执行方式: mysql -u ai_chat_user -p ai_chat < migrations/001_add_workflow_fields.sql

USE ai_chat;

-- 检查并添加 workflow_type 字段
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'ai_chat' 
  AND TABLE_NAME = 'agents' 
  AND COLUMN_NAME = 'workflow_type';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE agents ADD COLUMN workflow_type VARCHAR(20) DEFAULT ''simple'' AFTER usage_count',
    'SELECT ''workflow_type column already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 workflow_definition 字段
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'ai_chat' 
  AND TABLE_NAME = 'agents' 
  AND COLUMN_NAME = 'workflow_definition';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE agents ADD COLUMN workflow_definition JSON AFTER workflow_type',
    'SELECT ''workflow_definition column already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 template_id 字段
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'ai_chat' 
  AND TABLE_NAME = 'agents' 
  AND COLUMN_NAME = 'template_id';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE agents ADD COLUMN template_id VARCHAR(50) AFTER workflow_definition',
    'SELECT ''template_id column already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 custom_code 字段
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'ai_chat' 
  AND TABLE_NAME = 'agents' 
  AND COLUMN_NAME = 'custom_code';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE agents ADD COLUMN custom_code TEXT AFTER template_id',
    'SELECT ''custom_code column already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加索引（如果不存在）
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'ai_chat' 
  AND TABLE_NAME = 'agents' 
  AND INDEX_NAME = 'idx_workflow_type';

SET @query = IF(@index_exists = 0,
    'CREATE INDEX idx_workflow_type ON agents(workflow_type)',
    'SELECT ''idx_workflow_type index already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'ai_chat' 
  AND TABLE_NAME = 'agents' 
  AND INDEX_NAME = 'idx_template_id';

SET @query = IF(@index_exists = 0,
    'CREATE INDEX idx_template_id ON agents(template_id)',
    'SELECT ''idx_template_id index already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 显示迁移完成信息
SELECT '✅ Migration completed: Eino workflow fields added to agents table' AS status;

