package services

import (
	"context"
	"errors"
	"fmt"

	"ai-chat-backend/models"
	
	"github.com/cloudwego/eino/schema"
)

type EinoService struct {
	aiService *AIService
}

func NewEinoService() *EinoService {
	return &EinoService{
		aiService: NewAIService(),
	}
}

// ExecuteAgent 执行 Agent（根据类型选择执行方式）
func (s *EinoService) ExecuteAgent(ctx context.Context, agent models.Agent, messages []models.Message) (string, int, int, error) {
	switch agent.WorkflowType {
	case models.WorkflowSimple, "":
		// 使用原有的简单执行方式
		return s.aiService.Chat(agent, messages)
		
	case models.WorkflowTemplate:
		// 基于模板执行
		return s.executeTemplateAgent(ctx, agent, messages)
		
	case models.WorkflowVisual:
		// 执行可视化工作流
		return s.executeVisualWorkflow(ctx, agent, messages)
		
	case models.WorkflowCode:
		// 执行自定义代码
		return s.executeCustomCode(ctx, agent, messages)
		
	default:
		return "", 0, 0, fmt.Errorf("不支持的工作流类型: %s", agent.WorkflowType)
	}
}

// executeTemplateAgent 执行模板 Agent
func (s *EinoService) executeTemplateAgent(ctx context.Context, agent models.Agent, messages []models.Message) (string, int, int, error) {
	// 模板 Agent 目前使用简单的执行方式
	// 未来会根据模板的 workflow_definition 构建复杂的 Eino 工作流
	
	// 目前直接使用 AIService 执行
	return s.aiService.Chat(agent, messages)
}

// executeVisualWorkflow 执行可视化工作流
func (s *EinoService) executeVisualWorkflow(ctx context.Context, agent models.Agent, messages []models.Message) (string, int, int, error) {
	// 第四步会实现
	return "", 0, 0, errors.New("可视化工作流功能即将在第四步推出")
}

// executeCustomCode 执行自定义代码
func (s *EinoService) executeCustomCode(ctx context.Context, agent models.Agent, messages []models.Message) (string, int, int, error) {
	// 第五步会实现
	return "", 0, 0, errors.New("自定义代码功能即将在第五步推出")
}

// BuildSimpleReActAgent 构建简单的 ReAct Agent（示例）
func (s *EinoService) BuildSimpleReActAgent(ctx context.Context, agent models.Agent) error {
	// 这是一个示例，展示如何使用 Eino 构建 Agent
	// 实际使用时会根据 agent 配置动态构建
	
	// 注意：这只是示例代码结构，实际需要根据你的 API 配置来创建 ChatModel
	// 真正的实现会在后续步骤中完善
	
	fmt.Printf("准备构建 ReAct Agent: %s (ID: %d)\n", agent.Name, agent.ID)
	fmt.Printf("工作流类型: %s\n", agent.WorkflowType)
	
	return nil
}

// ConvertMessagesToEinoFormat 将消息转换为 Eino 格式
func (s *EinoService) ConvertMessagesToEinoFormat(messages []models.Message, systemPrompt string) []*schema.Message {
	einoMessages := make([]*schema.Message, 0, len(messages)+1)
	
	// 添加系统提示词
	if systemPrompt != "" {
		einoMessages = append(einoMessages, schema.SystemMessage(systemPrompt))
	}
	
	// 转换历史消息
	for _, msg := range messages {
		switch msg.Role {
		case models.RoleUser:
			einoMessages = append(einoMessages, schema.UserMessage(msg.Content))
		case models.RoleAssistant:
			// AssistantMessage 需要两个参数：content 和 toolCalls
			einoMessages = append(einoMessages, schema.AssistantMessage(msg.Content, nil))
		case models.RoleSystem:
			einoMessages = append(einoMessages, schema.SystemMessage(msg.Content))
		}
	}
	
	return einoMessages
}

// ValidateWorkflowDefinition 验证工作流定义
func (s *EinoService) ValidateWorkflowDefinition(definition models.EinoWorkflowDefinition) error {
	if len(definition.Nodes) == 0 {
		return errors.New("工作流至少需要一个节点")
	}
	
	// 验证节点ID唯一性
	nodeIDs := make(map[string]bool)
	for _, node := range definition.Nodes {
		if node.ID == "" {
			return errors.New("节点ID不能为空")
		}
		if nodeIDs[node.ID] {
			return fmt.Errorf("节点ID重复: %s", node.ID)
		}
		nodeIDs[node.ID] = true
		
		// 验证节点类型
		validTypes := map[string]bool{
			"chatmodel": true,
			"tool":      true,
			"lambda":    true,
			"retriever": true,
			"start":     true,
			"end":       true,
		}
		if !validTypes[node.Type] {
			return fmt.Errorf("不支持的节点类型: %s", node.Type)
		}
	}
	
	// 验证边的有效性
	for _, edge := range definition.Edges {
		if !nodeIDs[edge.Source] {
			return fmt.Errorf("边的源节点不存在: %s", edge.Source)
		}
		if !nodeIDs[edge.Target] {
			return fmt.Errorf("边的目标节点不存在: %s", edge.Target)
		}
	}
	
	// 检查是否有孤立节点（没有连接的节点）
	if len(definition.Edges) > 0 {
		connectedNodes := make(map[string]bool)
		for _, edge := range definition.Edges {
			connectedNodes[edge.Source] = true
			connectedNodes[edge.Target] = true
		}
		
		for _, node := range definition.Nodes {
			if !connectedNodes[node.ID] && node.Type != "start" && node.Type != "end" {
				fmt.Printf("警告: 节点 %s 没有连接到工作流\n", node.ID)
			}
		}
	}
	
	return nil
}

// GetWorkflowSummary 获取工作流摘要信息
func (s *EinoService) GetWorkflowSummary(definition models.EinoWorkflowDefinition) map[string]interface{} {
	nodeTypeCount := make(map[string]int)
	for _, node := range definition.Nodes {
		nodeTypeCount[node.Type]++
	}
	
	return map[string]interface{}{
		"total_nodes":     len(definition.Nodes),
		"total_edges":     len(definition.Edges),
		"node_type_count": nodeTypeCount,
		"is_valid":        s.ValidateWorkflowDefinition(definition) == nil,
	}
}

