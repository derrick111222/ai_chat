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
}

func (a *Agent) ToResponse() AgentResponse {
	return AgentResponse{
		ID:           a.ID,
		Name:         a.Name,
		Description:  a.Description,
		AvatarURL:    a.AvatarURL,
		SystemPrompt: a.SystemPrompt,
		APIConfigID:  a.APIConfigID,
		ModelName:    a.ModelName,
		ModelParams:  a.ModelParams,
		Tools:        a.Tools,
		IsPublic:     a.IsPublic,
		UsageCount:   a.UsageCount,
		CreatedAt:    a.CreatedAt,
		APIConfig:    a.APIConfig,
	}
}

