package models

import (
	"time"
)

type TokenUsage struct {
	ID             uint      `gorm:"primarykey" json:"id"`
	UserID         uint      `gorm:"not null;index:idx_user_date" json:"user_id"`
	AgentID        *uint     `gorm:"index:idx_agent_date" json:"agent_id"`
	ConversationID *uint     `json:"conversation_id"`
	Date           time.Time `gorm:"type:date;not null;index:idx_user_date,idx_agent_date" json:"date"`
	InputTokens    int       `gorm:"default:0" json:"input_tokens"`
	OutputTokens   int       `gorm:"default:0" json:"output_tokens"`
	EstimatedCost  float64   `gorm:"type:decimal(10,6);default:0" json:"estimated_cost"`
	CreatedAt      time.Time `json:"created_at"`
	User           User      `gorm:"foreignKey:UserID" json:"-"`
}

type UsageStatsResponse struct {
	TotalInputTokens  int     `json:"total_input_tokens"`
	TotalOutputTokens int     `json:"total_output_tokens"`
	TotalTokens       int     `json:"total_tokens"`
	TotalCost         float64 `json:"total_cost"`
	ConversationCount int     `json:"conversation_count"`
	MessageCount      int     `json:"message_count"`
}

type DailyUsageResponse struct {
	Date         string  `json:"date"`
	InputTokens  int     `json:"input_tokens"`
	OutputTokens int     `json:"output_tokens"`
	TotalTokens  int     `json:"total_tokens"`
	Cost         float64 `json:"cost"`
}

