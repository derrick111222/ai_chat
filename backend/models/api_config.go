package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
	"gorm.io/gorm"
)

type AuthType string

const (
	AuthBearer AuthType = "bearer"
	AuthAPIKey AuthType = "api_key"
	AuthCustom AuthType = "custom"
)

type FieldMapping struct {
	RequestMapping  map[string]interface{} `json:"request_mapping"`
	ResponseMapping map[string]interface{} `json:"response_mapping"`
}

func (f FieldMapping) Value() (driver.Value, error) {
	return json.Marshal(f)
}

func (f *FieldMapping) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, f)
}

type APIConfig struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	UserID       uint           `gorm:"not null;index" json:"user_id"`
	Name         string         `gorm:"size:100;not null" json:"name"`
	APIType      string         `gorm:"size:50;not null" json:"api_type"` // openrouter, openai, claude, custom
	EndpointURL  string         `gorm:"size:500;not null" json:"endpoint_url"`
	AuthType     AuthType       `gorm:"type:enum('bearer','api_key','custom');default:'bearer'" json:"auth_type"`
	Credentials  string         `gorm:"type:text;not null" json:"-"` // 加密存储
	FieldMapping FieldMapping   `gorm:"type:json" json:"field_mapping"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	User         User           `gorm:"foreignKey:UserID" json:"-"`
}

type APIConfigRequest struct {
	Name         string       `json:"name" binding:"required"`
	APIType      string       `json:"api_type" binding:"required"`
	EndpointURL  string       `json:"endpoint_url" binding:"required,url"`
	AuthType     AuthType     `json:"auth_type" binding:"required"`
	Credentials  string       `json:"credentials" binding:"required"`
	FieldMapping FieldMapping `json:"field_mapping"`
	IsActive     bool         `json:"is_active"`
}

type APIConfigResponse struct {
	ID           uint         `json:"id"`
	Name         string       `json:"name"`
	APIType      string       `json:"api_type"`
	EndpointURL  string       `json:"endpoint_url"`
	AuthType     AuthType     `json:"auth_type"`
	FieldMapping FieldMapping `json:"field_mapping"`
	IsActive     bool         `json:"is_active"`
	CreatedAt    time.Time    `json:"created_at"`
}

func (a *APIConfig) ToResponse() APIConfigResponse {
	return APIConfigResponse{
		ID:           a.ID,
		Name:         a.Name,
		APIType:      a.APIType,
		EndpointURL:  a.EndpointURL,
		AuthType:     a.AuthType,
		FieldMapping: a.FieldMapping,
		IsActive:     a.IsActive,
		CreatedAt:    a.CreatedAt,
	}
}

