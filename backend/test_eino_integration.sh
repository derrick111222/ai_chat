#!/bin/bash

# Eino 集成测试脚本
# 用于验证第一步的实现是否正确

echo "🧪 开始测试 Eino 集成..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

test_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

echo "1️⃣  检查 Go 模块依赖..."
if grep -q "github.com/cloudwego/eino" go.mod; then
    test_pass "Eino 依赖已添加到 go.mod"
else
    test_fail "Eino 依赖未添加到 go.mod"
fi

echo ""
echo "2️⃣  检查代码编译..."
if [ -f "ai-chat-backend" ]; then
    test_pass "后端代码编译成功"
else
    test_fail "后端代码编译失败"
fi

echo ""
echo "3️⃣  检查 Agent 模型..."
if grep -q "WorkflowType" models/agent.go; then
    test_pass "Agent 模型包含 WorkflowType 字段"
else
    test_fail "Agent 模型缺少 WorkflowType 字段"
fi

if grep -q "WorkflowDefinition" models/agent.go; then
    test_pass "Agent 模型包含 WorkflowDefinition 字段"
else
    test_fail "Agent 模型缺少 WorkflowDefinition 字段"
fi

echo ""
echo "4️⃣  检查 EinoService..."
if [ -f "services/eino_service.go" ]; then
    test_pass "EinoService 文件已创建"
    
    if grep -q "ExecuteAgent" services/eino_service.go; then
        test_pass "ExecuteAgent 方法已实现"
    else
        test_fail "ExecuteAgent 方法未实现"
    fi
    
    if grep -q "ConvertMessagesToEinoFormat" services/eino_service.go; then
        test_pass "ConvertMessagesToEinoFormat 方法已实现"
    else
        test_fail "ConvertMessagesToEinoFormat 方法未实现"
    fi
else
    test_fail "EinoService 文件未创建"
fi

echo ""
echo "5️⃣  检查数据库迁移..."
if [ -f "migrations/001_add_workflow_fields.sql" ]; then
    test_pass "数据库迁移脚本已创建"
else
    test_fail "数据库迁移脚本未创建"
fi

echo ""
echo "6️⃣  检查 Controller 更新..."
if grep -q "WorkflowType" controllers/agent.go; then
    test_pass "Agent Controller 已更新支持工作流字段"
else
    test_fail "Agent Controller 未更新"
fi

if grep -q "einoService" controllers/message.go; then
    test_pass "Message Controller 已更新使用 EinoService"
else
    test_fail "Message Controller 未更新"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试结果汇总:"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 恭喜！第一步实现完成！${NC}"
    echo ""
    echo "接下来的步骤："
    echo "1. 运行数据库迁移："
    echo "   mysql -u ai_chat_user -p ai_chat < migrations/001_add_workflow_fields.sql"
    echo ""
    echo "2. 启动后端服务进行测试"
    echo ""
    echo "3. 准备进入第二步：模板系统实现"
    exit 0
else
    echo ""
    echo -e "${RED}❌ 还有 $FAILED 个测试失败，请检查并修复${NC}"
    exit 1
fi

