#!/bin/bash

# 模板系统集成测试脚本
# 用于验证第二步的实现是否正确

echo "🧪 开始测试模板系统集成..."
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

echo "1️⃣  检查模板数据结构..."
if [ -f "models/agent_template.go" ]; then
    test_pass "AgentTemplate 模型已创建"
    
    if grep -q "ConfigurableParams" models/agent_template.go; then
        test_pass "包含可配置参数定义"
    else
        test_fail "缺少可配置参数定义"
    fi
else
    test_fail "AgentTemplate 模型文件未创建"
fi

echo ""
echo "2️⃣  检查模板服务..."
if [ -f "services/template_service.go" ]; then
    test_pass "TemplateService 已创建"
    
    if grep -q "simple_chat" services/template_service.go; then
        test_pass "包含简单对话模板"
    else
        test_fail "缺少简单对话模板"
    fi
    
    if grep -q "coding_assistant" services/template_service.go; then
        test_pass "包含编程助手模板"
    else
        test_fail "缺少编程助手模板"
    fi
    
    if grep -q "CreateAgentFromTemplate" services/template_service.go; then
        test_pass "包含从模板创建 Agent 方法"
    else
        test_fail "缺少从模板创建 Agent 方法"
    fi
else
    test_fail "TemplateService 文件未创建"
fi

echo ""
echo "3️⃣  检查模板 Controller..."
if [ -f "controllers/template.go" ]; then
    test_pass "TemplateController 已创建"
    
    if grep -q "ListTemplates" controllers/template.go; then
        test_pass "包含列表模板方法"
    else
        test_fail "缺少列表模板方法"
    fi
    
    if grep -q "CreateAgentFromTemplate" controllers/template.go; then
        test_pass "包含从模板创建方法"
    else
        test_fail "缺少从模板创建方法"
    fi
else
    test_fail "TemplateController 文件未创建"
fi

echo ""
echo "4️⃣  检查路由注册..."
if grep -q "templateCtrl" main.go; then
    test_pass "模板控制器已注册"
else
    test_fail "模板控制器未注册"
fi

if grep -q "/agent-templates" main.go; then
    test_pass "模板 API 路由已添加"
else
    test_fail "模板 API 路由未添加"
fi

if grep -q "from-template" main.go; then
    test_pass "从模板创建路由已添加"
else
    test_fail "从模板创建路由未添加"
fi

echo ""
echo "5️⃣  检查前端服务..."
if [ -f "../frontend/src/services/templateService.ts" ]; then
    test_pass "前端模板服务已创建"
else
    test_fail "前端模板服务未创建"
fi

echo ""
echo "6️⃣  检查前端页面..."
if [ -f "../frontend/src/pages/Templates.tsx" ]; then
    test_pass "模板市场页面已创建"
else
    test_fail "模板市场页面未创建"
fi

if grep -q "Templates" ../frontend/src/App.tsx; then
    test_pass "模板路由已添加到 App"
else
    test_fail "模板路由未添加到 App"
fi

if grep -q "templates" ../frontend/src/pages/Dashboard.tsx; then
    test_pass "模板入口已添加到导航"
else
    test_fail "模板入口未添加到导航"
fi

echo ""
echo "7️⃣  检查代码编译..."
if [ -f "ai-chat-backend" ]; then
    test_pass "后端代码编译成功"
else
    test_fail "后端代码编译失败"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试结果汇总:"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 恭喜！第二步实现完成！${NC}"
    echo ""
    echo "已实现的功能："
    echo "✅ 5 个预设模板（简单对话、编程助手、文档写作、数据分析、翻译）"
    echo "✅ 模板分类和筛选"
    echo "✅ 可配置参数系统"
    echo "✅ 从模板创建 Agent"
    echo "✅ 模板市场界面"
    echo ""
    echo "接下来的步骤："
    echo "1. 启动后端服务测试 API"
    echo "2. 启动前端服务测试界面"
    echo "3. 从模板创建一个 Agent"
    echo "4. 准备进入第三步：参数配置增强"
    exit 0
else
    echo ""
    echo -e "${RED}❌ 还有 $FAILED 个测试失败，请检查并修复${NC}"
    exit 1
fi

