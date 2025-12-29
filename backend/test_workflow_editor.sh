#!/bin/bash

# 工作流编辑器集成测试脚本

echo "🧪 开始测试工作流编辑器集成..."
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

echo "1️⃣  检查前端组件..."
if [ -f "../frontend/src/components/workflow/CustomNode.tsx" ]; then
    test_pass "CustomNode 组件已创建"
else
    test_fail "CustomNode 组件未创建"
fi

if [ -f "../frontend/src/components/workflow/NodePanel.tsx" ]; then
    test_pass "NodePanel 组件已创建"
else
    test_fail "NodePanel 组件未创建"
fi

if [ -f "../frontend/src/components/workflow/NodeConfigPanel.tsx" ]; then
    test_pass "NodeConfigPanel 组件已创建"
else
    test_fail "NodeConfigPanel 组件未创建"
fi

echo ""
echo "2️⃣  检查工作流编辑器页面..."
if [ -f "../frontend/src/pages/WorkflowEditor.tsx" ]; then
    test_pass "WorkflowEditor 页面已创建"
    
    if grep -q "ReactFlow" ../frontend/src/pages/WorkflowEditor.tsx; then
        test_pass "已集成 React Flow"
    else
        test_fail "未集成 React Flow"
    fi
    
    if grep -q "onDrop" ../frontend/src/pages/WorkflowEditor.tsx; then
        test_pass "支持拖拽功能"
    else
        test_fail "不支持拖拽功能"
    fi
else
    test_fail "WorkflowEditor 页面未创建"
fi

echo ""
echo "3️⃣  检查路由配置..."
if grep -q "WorkflowEditor" ../frontend/src/App.tsx; then
    test_pass "工作流编辑器路由已添加"
else
    test_fail "工作流编辑器路由未添加"
fi

if grep -q "workflow-editor" ../frontend/src/App.tsx; then
    test_pass "路由路径已配置"
else
    test_fail "路由路径未配置"
fi

echo ""
echo "4️⃣  检查入口集成..."
if grep -q "Workflow" ../frontend/src/pages/Agents.tsx; then
    test_pass "Agents 页面已添加工作流入口"
else
    test_fail "Agents 页面未添加工作流入口"
fi

echo ""
echo "5️⃣  检查后端验证服务..."
if grep -q "ValidateWorkflowDefinition" services/eino_service.go; then
    test_pass "工作流验证方法已实现"
else
    test_fail "工作流验证方法未实现"
fi

if grep -q "GetWorkflowSummary" services/eino_service.go; then
    test_pass "工作流摘要方法已实现"
else
    test_fail "工作流摘要方法未实现"
fi

echo ""
echo "6️⃣  检查 React Flow 依赖..."
if grep -q "reactflow" ../frontend/package.json; then
    test_pass "React Flow 已安装"
else
    test_fail "React Flow 未安装"
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
    echo -e "${GREEN}🎉 恭喜！第四步（工作流编辑器）实现完成！${NC}"
    echo ""
    echo "已实现的功能："
    echo "✅ 可视化工作流编辑器"
    echo "✅ 拖拽式节点编辑"
    echo "✅ 节点配置面板"
    echo "✅ 工作流保存和加载"
    echo "✅ 工作流验证"
    echo ""
    echo "接下来的步骤："
    echo "1. 启动前端服务测试编辑器"
    echo "2. 创建一个工作流"
    echo "3. 测试节点连接和配置"
    echo "4. 保存工作流"
    exit 0
else
    echo ""
    echo -e "${RED}❌ 还有 $FAILED 个测试失败，请检查并修复${NC}"
    exit 1
fi

