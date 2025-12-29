package models

import (
	"database/sql/driver"
	"encoding/json"
)

// AgentTemplate Agent 模板定义
type AgentTemplate struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Category    string                 `json:"category"` // conversation, rag, react, tool_calling
	Icon        string                 `json:"icon"`
	Tags        []string               `json:"tags"`
	
	// 模板配置
	DefaultSystemPrompt string                 `json:"default_system_prompt"`
	DefaultModelName    string                 `json:"default_model_name"`
	DefaultModelParams  ModelParams            `json:"default_model_params"`
	RequiredTools       []string               `json:"required_tools,omitempty"`
	
	// 可配置参数定义
	ConfigurableParams []TemplateParam        `json:"configurable_params"`
	
	// Eino 工作流定义
	WorkflowDefinition EinoWorkflowDefinition `json:"workflow_definition"`
	
	// 元数据
	Author      string `json:"author"`
	Version     string `json:"version"`
	IsBuiltIn   bool   `json:"is_built_in"`
	UsageCount  int    `json:"usage_count"`
}

// TemplateParam 模板参数定义
type TemplateParam struct {
	Name         string      `json:"name"`
	Label        string      `json:"label"`
	Type         string      `json:"type"` // string, number, boolean, select, multiselect
	Description  string      `json:"description"`
	DefaultValue interface{} `json:"default_value"`
	Required     bool        `json:"required"`
	Options      []ParamOption `json:"options,omitempty"` // 用于 select 类型
	Validation   *ParamValidation `json:"validation,omitempty"`
}

// ParamOption 参数选项
type ParamOption struct {
	Label string      `json:"label"`
	Value interface{} `json:"value"`
}

// ParamValidation 参数验证规则
type ParamValidation struct {
	Min     *float64 `json:"min,omitempty"`
	Max     *float64 `json:"max,omitempty"`
	Pattern string   `json:"pattern,omitempty"`
}

// AgentTemplateRequest 从模板创建 Agent 的请求
type AgentTemplateRequest struct {
	TemplateID string                 `json:"template_id" binding:"required"`
	Name       string                 `json:"name" binding:"required"`
	Description string                `json:"description"`
	APIConfigID *uint                 `json:"api_config_id"`
	IsPublic   bool                   `json:"is_public"`
	
	// 用户配置的参数
	Params map[string]interface{} `json:"params"`
}

// AgentTemplateListResponse 模板列表响应
type AgentTemplateListResponse struct {
	Templates []AgentTemplate `json:"templates"`
	Total     int             `json:"total"`
}

// TemplateCategory 模板分类
type TemplateCategory struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Count       int    `json:"count"`
}

// 实现 JSON 序列化
func (t AgentTemplate) Value() (driver.Value, error) {
	return json.Marshal(t)
}

func (t *AgentTemplate) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, t)
}

