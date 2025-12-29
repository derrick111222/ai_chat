package controllers

import (
	"bufio"
	"encoding/json"
	"fmt"
	"strings"

	"ai-chat-backend/database"
	"ai-chat-backend/middleware"
	"ai-chat-backend/models"
	"ai-chat-backend/services"
	"ai-chat-backend/utils"

	"github.com/gin-gonic/gin"
)

type MessageController struct{}

// SendMessage 发送消息（非流式）
func (mc *MessageController) SendMessage(c *gin.Context) {
	userID := middleware.GetUserID(c)
	conversationID := c.Param("id")

	// 验证对话
	var conversation models.Conversation
	if err := database.DB.Preload("Agent.APIConfig").Where("id = ? AND user_id = ?", conversationID, userID).First(&conversation).Error; err != nil {
		utils.NotFound(c, "对话不存在")
		return
	}

	var req models.MessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	// 保存用户消息
	userMessage := models.Message{
		ConversationID: conversation.ID,
		Role:           models.RoleUser,
		Content:        req.Content,
		Attachments:    req.Attachments,
	}

	if err := database.DB.Create(&userMessage).Error; err != nil {
		utils.InternalServerError(c, "保存消息失败")
		return
	}

	// 获取历史消息
	var messages []models.Message
	database.DB.Where("conversation_id = ?", conversationID).Order("created_at ASC").Find(&messages)

	// 调用 Eino 服务（会根据 Agent 的 WorkflowType 自动选择执行方式）
	einoService := services.NewEinoService()
	response, inputTokens, outputTokens, err := einoService.ExecuteAgent(c.Request.Context(), conversation.Agent, messages)
	if err != nil {
		utils.InternalServerError(c, "AI服务调用失败: "+err.Error())
		return
	}

	// 保存AI回复
	assistantMessage := models.Message{
		ConversationID: conversation.ID,
		Role:           models.RoleAssistant,
		Content:        response,
		InputTokens:    inputTokens,
		OutputTokens:   outputTokens,
	}

	if err := database.DB.Create(&assistantMessage).Error; err != nil {
		utils.InternalServerError(c, "保存AI回复失败")
		return
	}

	// 更新对话统计
	conversation.TotalTokens += inputTokens + outputTokens
	database.DB.Save(&conversation)

	// 更新Token使用统计
	services.UpdateTokenUsage(userID, conversation.AgentID, conversation.ID, inputTokens, outputTokens)

	utils.Success(c, gin.H{
		"user_message":      userMessage.ToResponse(),
		"assistant_message": assistantMessage.ToResponse(),
	})
}

// StreamMessage 流式发送消息（SSE）
func (mc *MessageController) StreamMessage(c *gin.Context) {
	userID := middleware.GetUserID(c)
	conversationID := c.Param("id")

	// 验证对话
	var conversation models.Conversation
	if err := database.DB.Preload("Agent.APIConfig").Where("id = ? AND user_id = ?", conversationID, userID).First(&conversation).Error; err != nil {
		utils.NotFound(c, "对话不存在")
		return
	}

	var req models.MessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	// 保存用户消息
	userMessage := models.Message{
		ConversationID: conversation.ID,
		Role:           models.RoleUser,
		Content:        req.Content,
		Attachments:    req.Attachments,
	}

	if err := database.DB.Create(&userMessage).Error; err != nil {
		utils.InternalServerError(c, "保存消息失败")
		return
	}

	// 设置SSE响应头
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Transfer-Encoding", "chunked")

	// 获取历史消息
	var messages []models.Message
	database.DB.Where("conversation_id = ?", conversationID).Order("created_at ASC").Find(&messages)

	// 调用AI服务（流式）
	// 注意：流式处理目前仅支持 simple 模式，未来版本会支持 Eino 工作流的流式处理
	aiService := services.NewAIService()
	stream, err := aiService.ChatStream(conversation.Agent, messages)
	if err != nil {
		sendSSE(c, "error", gin.H{"message": err.Error()})
		return
	}
	defer stream.Close()

	// 发送用户消息事件
	sendSSE(c, "user_message", userMessage.ToResponse())

	// 读取流式响应
	var fullResponse strings.Builder
	scanner := bufio.NewScanner(stream)

	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				break
			}

			// 解析并转发数据
			var chunk map[string]interface{}
			if err := json.Unmarshal([]byte(data), &chunk); err == nil {
				// 提取内容
				if choices, ok := chunk["choices"].([]interface{}); ok && len(choices) > 0 {
					if choice, ok := choices[0].(map[string]interface{}); ok {
						if delta, ok := choice["delta"].(map[string]interface{}); ok {
							if content, ok := delta["content"].(string); ok {
								fullResponse.WriteString(content)
								sendSSE(c, "content", gin.H{"content": content})
							}
						}
					}
				}
			}
		}
	}

	// 保存完整的AI回复
	assistantMessage := models.Message{
		ConversationID: conversation.ID,
		Role:           models.RoleAssistant,
		Content:        fullResponse.String(),
		InputTokens:    0, // 流式响应中需要单独计算
		OutputTokens:   0,
	}

	if err := database.DB.Create(&assistantMessage).Error; err == nil {
		sendSSE(c, "assistant_message", assistantMessage.ToResponse())
		sendSSE(c, "done", gin.H{"message_id": assistantMessage.ID})
	}

	c.Writer.Flush()
}

// DeleteMessage 删除消息
func (mc *MessageController) DeleteMessage(c *gin.Context) {
	userID := middleware.GetUserID(c)
	messageID := c.Param("id")

	var message models.Message
	if err := database.DB.Preload("Conversation").First(&message, messageID).Error; err != nil {
		utils.NotFound(c, "消息不存在")
		return
	}

	// 验证权限
	if message.Conversation.UserID != userID {
		utils.Forbidden(c, "无权删除此消息")
		return
	}

	if err := database.DB.Delete(&message).Error; err != nil {
		utils.InternalServerError(c, "删除消息失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

// sendSSE 发送SSE事件
func sendSSE(c *gin.Context, event string, data interface{}) {
	jsonData, _ := json.Marshal(data)
	fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", event, jsonData)
	c.Writer.Flush()
}
