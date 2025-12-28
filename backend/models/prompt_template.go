package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
	"gorm.io/gorm"
)

type Variables []string

func (v Variables) Value() (driver.Value, error) {
	return json.Marshal(v)
}

func (v *Variables) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, v)
}

type PromptTemplate struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	UserID      *uint          `gorm:"index" json:"user_id"`
	Name        string         `gorm:"size:100;not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Category    string         `gorm:"size:50;index" json:"category"`
	Content     string         `gorm:"type:text;not null" json:"content"`
	Variables   Variables      `gorm:"type:json" json:"variables"`
	IsPublic    bool           `gorm:"default:false;index" json:"is_public"`
	UsageCount  int            `gorm:"default:0" json:"usage_count"`
	Rating      float64        `gorm:"type:decimal(3,2);default:0" json:"rating"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	User        *User          `gorm:"foreignKey:UserID" json:"-"`
}

type PromptTemplateRequest struct {
	Name        string    `json:"name" binding:"required"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Content     string    `json:"content" binding:"required"`
	Variables   Variables `json:"variables"`
	IsPublic    bool      `json:"is_public"`
}

type PromptTemplateResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Content     string    `json:"content"`
	Variables   Variables `json:"variables"`
	IsPublic    bool      `json:"is_public"`
	UsageCount  int       `json:"usage_count"`
	Rating      float64   `json:"rating"`
	CreatedAt   time.Time `json:"created_at"`
}

func (p *PromptTemplate) ToResponse() PromptTemplateResponse {
	return PromptTemplateResponse{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		Category:    p.Category,
		Content:     p.Content,
		Variables:   p.Variables,
		IsPublic:    p.IsPublic,
		UsageCount:  p.UsageCount,
		Rating:      p.Rating,
		CreatedAt:   p.CreatedAt,
	}
}

