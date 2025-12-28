package models

import (
	"time"
)

type ConversationStatus string

const (
	StatusActive   ConversationStatus = "active"
	StatusArchived ConversationStatus = "archived"
	StatusDeleted  ConversationStatus = "deleted"
)

type Conversation struct {
	ID          uint               `gorm:"primarykey" json:"id"`
	UserID      uint               `gorm:"not null;index" json:"user_id"`
	AgentID     uint               `gorm:"not null;index" json:"agent_id"`
	Title       string             `gorm:"size:200" json:"title"`
	Status      ConversationStatus `gorm:"type:enum('active','archived','deleted');default:'active';index" json:"status"`
	TotalTokens int                `gorm:"default:0" json:"total_tokens"`
	TotalCost   float64            `gorm:"type:decimal(10,6);default:0" json:"total_cost"`
	CreatedAt   time.Time          `json:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"`
	DeletedAt   *time.Time         `json:"deleted_at"`
	User        User               `gorm:"foreignKey:UserID" json:"-"`
	Agent       Agent              `gorm:"foreignKey:AgentID" json:"agent,omitempty"`
	Messages    []Message          `gorm:"foreignKey:ConversationID" json:"messages,omitempty"`
}

type ConversationRequest struct {
	AgentID uint   `json:"agent_id" binding:"required"`
	Title   string `json:"title"`
}

type ConversationResponse struct {
	ID           uint               `json:"id"`
	AgentID      uint               `json:"agent_id"`
	Title        string             `json:"title"`
	Status       ConversationStatus `json:"status"`
	TotalTokens  int                `json:"total_tokens"`
	TotalCost    float64            `json:"total_cost"`
	CreatedAt    time.Time          `json:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at"`
	Agent        *AgentResponse     `json:"agent,omitempty"`
	MessageCount int                `json:"message_count,omitempty"`
}

func (c *Conversation) ToResponse() ConversationResponse {
	resp := ConversationResponse{
		ID:          c.ID,
		AgentID:     c.AgentID,
		Title:       c.Title,
		Status:      c.Status,
		TotalTokens: c.TotalTokens,
		TotalCost:   c.TotalCost,
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.UpdatedAt,
	}

	if c.Agent.ID != 0 {
		agentResp := c.Agent.ToResponse()
		resp.Agent = &agentResp
	}

	return resp
}
