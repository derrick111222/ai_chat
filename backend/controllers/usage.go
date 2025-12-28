package controllers

import (
	"ai-chat-backend/database"
	"ai-chat-backend/middleware"
	"ai-chat-backend/models"
	"ai-chat-backend/utils"

	"github.com/gin-gonic/gin"
)

type UsageController struct{}

// GetStats 获取总体统计
func (uc *UsageController) GetStats(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var stats models.UsageStatsResponse

	// 统计总Token使用量
	database.DB.Model(&models.TokenUsage{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(input_tokens), 0) as total_input_tokens, COALESCE(SUM(output_tokens), 0) as total_output_tokens, COALESCE(SUM(estimated_cost), 0) as total_cost").
		Scan(&stats)

	stats.TotalTokens = stats.TotalInputTokens + stats.TotalOutputTokens

	// 统计对话数量
	var conversationCount int64
	database.DB.Model(&models.Conversation{}).
		Where("user_id = ? AND status = ?", userID, models.StatusActive).
		Count(&conversationCount)
	stats.ConversationCount = int(conversationCount)

	// 统计消息数量
	var messageCount int64
	database.DB.Model(&models.Message{}).
		Joins("JOIN conversations ON messages.conversation_id = conversations.id").
		Where("conversations.user_id = ?", userID).
		Count(&messageCount)
	stats.MessageCount = int(messageCount)

	utils.Success(c, stats)
}

// GetDailyUsage 获取每日使用统计
func (uc *UsageController) GetDailyUsage(c *gin.Context) {
	userID := middleware.GetUserID(c)
	days := c.DefaultQuery("days", "30")

	var usages []models.TokenUsage
	database.DB.Where("user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)", userID, days).
		Order("date ASC").
		Find(&usages)

	var responses []models.DailyUsageResponse
	for _, usage := range usages {
		responses = append(responses, models.DailyUsageResponse{
			Date:         usage.Date.Format("2006-01-02"),
			InputTokens:  usage.InputTokens,
			OutputTokens: usage.OutputTokens,
			TotalTokens:  usage.InputTokens + usage.OutputTokens,
			Cost:         usage.EstimatedCost,
		})
	}

	utils.Success(c, responses)
}

// GetByAgent 按智能体统计
func (uc *UsageController) GetByAgent(c *gin.Context) {
	userID := middleware.GetUserID(c)

	type AgentUsage struct {
		AgentID       uint    `json:"agent_id"`
		AgentName     string  `json:"agent_name"`
		InputTokens   int     `json:"input_tokens"`
		OutputTokens  int     `json:"output_tokens"`
		TotalTokens   int     `json:"total_tokens"`
		EstimatedCost float64 `json:"estimated_cost"`
	}

	var results []AgentUsage
	database.DB.Model(&models.TokenUsage{}).
		Select("token_usages.agent_id, agents.name as agent_name, SUM(token_usages.input_tokens) as input_tokens, SUM(token_usages.output_tokens) as output_tokens, SUM(token_usages.estimated_cost) as estimated_cost").
		Joins("JOIN agents ON token_usages.agent_id = agents.id").
		Where("token_usages.user_id = ?", userID).
		Group("token_usages.agent_id, agents.name").
		Scan(&results)

	for i := range results {
		results[i].TotalTokens = results[i].InputTokens + results[i].OutputTokens
	}

	utils.Success(c, results)
}
