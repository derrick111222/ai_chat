package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
	"gorm.io/gorm"
)

type ModelParams struct {
	Temperature      float64 `json:"temperature"`
	MaxTokens        int     `json:"max_tokens"`
	TopP             float64 `json:"top_p"`
	TopK             int     `json:"top_k"`
	FrequencyPenalty float64 `json:"frequency_penalty"`
	PresencePenalty  float64 `json:"presence_penalty"`
}

func (m ModelParams) Value() (driver.Value, error) {
	return json.Marshal(m)
}

func (m *ModelParams) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, m)
}

type Tools []string

func (t Tools) Value() (driver.Value, error) {
	return json.Marshal(t)
}

func (t *Tools) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, t)
}

// WorkflowType Agent 工作流类型
type WorkflowType string

const (
	WorkflowSimple   WorkflowType = "simple"   // 简单配置（当前模式）
	WorkflowTemplate WorkflowType = "template" // 基于模板
	WorkflowVisual   WorkflowType = "visual"   // 可视化工作流
	WorkflowCode     WorkflowType = "code"     // 自定义代码
)

// EinoWorkflowDefinition Eino 工作流定义
type EinoWorkflowDefinition struct {
	Nodes []WorkflowNode `json:"nodes"`
	Edges []WorkflowEdge `json:"edges"`
}

// WorkflowNode 工作流节点
type WorkflowNode struct {
	ID       string                 `json:"id"`
	Type     string                 `json:"type"` // chatmodel, tool, lambda, retriever
	Config   map[string]interface{} `json:"config"`
	Position map[string]int         `json:"position,omitempty"`
}

// WorkflowEdge 工作流边
type WorkflowEdge struct {
	Source       string            `json:"source"`
	Target       string            `json:"target"`
	FieldMapping map[string]string `json:"field_mapping,omitempty"`
}

func (e EinoWorkflowDefinition) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *EinoWorkflowDefinition) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, e)
}

type Agent struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	UserID       uint           `gorm:"not null;index" json:"user_id"`
	Name         string         `gorm:"size:100;not null" json:"name"`
	Description  string         `gorm:"type:text" json:"description"`
	AvatarURL    string         `gorm:"size:500" json:"avatar_url"`
	SystemPrompt string         `gorm:"type:text" json:"system_prompt"`
	APIConfigID  *uint          `gorm:"index" json:"api_config_id"`
	ModelName    string         `gorm:"size:100" json:"model_name"`
	ModelParams  ModelParams    `gorm:"type:json" json:"model_params"`
	Tools        Tools          `gorm:"type:json" json:"tools"`
	IsPublic     bool           `gorm:"default:false;index" json:"is_public"`
	UsageCount   int            `gorm:"default:0" json:"usage_count"`
	
	// Eino 工作流相关字段
	WorkflowType       WorkflowType           `gorm:"type:varchar(20);default:'simple'" json:"workflow_type"`
	WorkflowDefinition EinoWorkflowDefinition `gorm:"type:json" json:"workflow_definition,omitempty"`
	TemplateID         string                 `gorm:"size:50" json:"template_id,omitempty"`
	CustomCode         string                 `gorm:"type:text" json:"custom_code,omitempty"`
	
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	User         User           `gorm:"foreignKey:UserID" json:"-"`
	APIConfig    *APIConfig     `gorm:"foreignKey:APIConfigID" json:"api_config,omitempty"`
}

type AgentRequest struct {
	Name         string      `json:"name" binding:"required"`
	Description  string      `json:"description"`
	AvatarURL    string      `json:"avatar_url"`
	SystemPrompt string      `json:"system_prompt"`
	APIConfigID  *uint       `json:"api_config_id"`
	ModelName    string      `json:"model_name" binding:"required"`
	ModelParams  ModelParams `json:"model_params"`
	Tools        Tools       `json:"tools"`
	IsPublic     bool        `json:"is_public"`
	
	// Eino 工作流相关字段
	WorkflowType       WorkflowType           `json:"workflow_type"`
	WorkflowDefinition EinoWorkflowDefinition `json:"workflow_definition,omitempty"`
	TemplateID         string                 `json:"template_id,omitempty"`
}

type AgentResponse struct {
	ID           uint         `json:"id"`
	Name         string       `json:"name"`
	Description  string       `json:"description"`
	AvatarURL    string       `json:"avatar_url"`
	SystemPrompt string       `json:"system_prompt"`
	APIConfigID  *uint        `json:"api_config_id"`
	ModelName    string       `json:"model_name"`
	ModelParams  ModelParams  `json:"model_params"`
	Tools        Tools        `json:"tools"`
	IsPublic     bool         `json:"is_public"`
	UsageCount   int          `json:"usage_count"`
	CreatedAt    time.Time    `json:"created_at"`
	APIConfig    *APIConfig   `json:"api_config,omitempty"`
	
	// Eino 工作流相关字段
	WorkflowType       WorkflowType           `json:"workflow_type"`
	WorkflowDefinition EinoWorkflowDefinition `json:"workflow_definition,omitempty"`
	TemplateID         string                 `json:"template_id,omitempty"`
}

func (a *Agent) ToResponse() AgentResponse {
	return AgentResponse{
		ID:                 a.ID,
		Name:               a.Name,
		Description:        a.Description,
		AvatarURL:          a.AvatarURL,
		SystemPrompt:       a.SystemPrompt,
		APIConfigID:        a.APIConfigID,
		ModelName:          a.ModelName,
		ModelParams:        a.ModelParams,
		Tools:              a.Tools,
		IsPublic:           a.IsPublic,
		UsageCount:         a.UsageCount,
		CreatedAt:          a.CreatedAt,
		APIConfig:          a.APIConfig,
		WorkflowType:       a.WorkflowType,
		WorkflowDefinition: a.WorkflowDefinition,
		TemplateID:         a.TemplateID,
	}
}

