package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type MessageRole string

const (
	RoleUser      MessageRole = "user"
	RoleAssistant MessageRole = "assistant"
	RoleSystem    MessageRole = "system"
)

type Attachments []map[string]interface{}

func (a Attachments) Value() (driver.Value, error) {
	return json.Marshal(a)
}

func (a *Attachments) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, a)
}

type Metadata map[string]interface{}

func (m Metadata) Value() (driver.Value, error) {
	return json.Marshal(m)
}

func (m *Metadata) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, m)
}

type Message struct {
	ID             uint        `gorm:"primarykey" json:"id"`
	ConversationID uint        `gorm:"not null;index" json:"conversation_id"`
	Role           MessageRole `gorm:"type:enum('user','assistant','system');not null" json:"role"`
	Content        string      `gorm:"type:text;not null" json:"content"`
	Attachments    Attachments `gorm:"type:json" json:"attachments"`
	InputTokens    int         `gorm:"default:0" json:"input_tokens"`
	OutputTokens   int         `gorm:"default:0" json:"output_tokens"`
	Metadata       Metadata    `gorm:"type:json" json:"metadata"`
	CreatedAt      time.Time   `json:"created_at"`
	Conversation   Conversation `gorm:"foreignKey:ConversationID" json:"-"`
}

type MessageRequest struct {
	Content     string      `json:"content" binding:"required"`
	Attachments Attachments `json:"attachments"`
}

type MessageResponse struct {
	ID             uint        `json:"id"`
	ConversationID uint        `json:"conversation_id"`
	Role           MessageRole `json:"role"`
	Content        string      `json:"content"`
	Attachments    Attachments `json:"attachments"`
	InputTokens    int         `json:"input_tokens"`
	OutputTokens   int         `json:"output_tokens"`
	Metadata       Metadata    `json:"metadata"`
	CreatedAt      time.Time   `json:"created_at"`
}

func (m *Message) ToResponse() MessageResponse {
	return MessageResponse{
		ID:             m.ID,
		ConversationID: m.ConversationID,
		Role:           m.Role,
		Content:        m.Content,
		Attachments:    m.Attachments,
		InputTokens:    m.InputTokens,
		OutputTokens:   m.OutputTokens,
		Metadata:       m.Metadata,
		CreatedAt:      m.CreatedAt,
	}
}

