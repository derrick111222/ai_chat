package services

import (
	"time"

	"ai-chat-backend/database"
	"ai-chat-backend/models"
)

// UpdateTokenUsage 更新Token使用统计
func UpdateTokenUsage(userID uint, agentID uint, conversationID uint, inputTokens int, outputTokens int) error {
	today := time.Now().Format("2006-01-02")
	date, _ := time.Parse("2006-01-02", today)

	// 估算成本（这里使用简单的估算，实际应该根据不同模型的定价）
	// OpenRouter的平均价格：输入$0.0001/1K tokens，输出$0.0002/1K tokens
	estimatedCost := (float64(inputTokens) * 0.0001 / 1000) + (float64(outputTokens) * 0.0002 / 1000)

	// 查找或创建当天的使用记录
	var usage models.TokenUsage
	result := database.DB.Where("user_id = ? AND agent_id = ? AND date = ?", userID, agentID, date).First(&usage)

	if result.Error != nil {
		// 创建新记录
		usage = models.TokenUsage{
			UserID:         userID,
			AgentID:        &agentID,
			ConversationID: &conversationID,
			Date:           date,
			InputTokens:    inputTokens,
			OutputTokens:   outputTokens,
			EstimatedCost:  estimatedCost,
		}
		return database.DB.Create(&usage).Error
	} else {
		// 更新现有记录
		usage.InputTokens += inputTokens
		usage.OutputTokens += outputTokens
		usage.EstimatedCost += estimatedCost
		return database.DB.Save(&usage).Error
	}
}

