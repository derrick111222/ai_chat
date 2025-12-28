package controllers

import (
	"ai-chat-backend/database"
	"ai-chat-backend/middleware"
	"ai-chat-backend/models"
	"ai-chat-backend/utils"
	"github.com/gin-gonic/gin"
)

type ConversationController struct{}

// List 获取对话列表
func (cc *ConversationController) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	status := c.DefaultQuery("status", string(models.StatusActive))

	var conversations []models.Conversation
	query := database.DB.Preload("Agent").Where("user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("updated_at DESC").Find(&conversations).Error; err != nil {
		utils.InternalServerError(c, "获取对话列表失败")
		return
	}

	var responses []models.ConversationResponse
	for _, conv := range conversations {
		// 获取消息数量
		var messageCount int64
		database.DB.Model(&models.Message{}).Where("conversation_id = ?", conv.ID).Count(&messageCount)
		
		resp := conv.ToResponse()
		resp.MessageCount = int(messageCount)
		responses = append(responses, resp)
	}

	utils.Success(c, responses)
}

// Create 创建对话
func (cc *ConversationController) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.ConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	// 验证智能体是否存在且有权访问
	var agent models.Agent
	if err := database.DB.First(&agent, req.AgentID).Error; err != nil {
		utils.NotFound(c, "智能体不存在")
		return
	}

	if agent.UserID != userID && !agent.IsPublic {
		utils.Forbidden(c, "无权使用此智能体")
		return
	}

	title := req.Title
	if title == "" {
		title = "新对话"
	}

	conversation := models.Conversation{
		UserID:  userID,
		AgentID: req.AgentID,
		Title:   title,
		Status:  models.StatusActive,
	}

	if err := database.DB.Create(&conversation).Error; err != nil {
		utils.InternalServerError(c, "创建对话失败")
		return
	}

	// 加载关联数据
	database.DB.Preload("Agent").First(&conversation, conversation.ID)

	utils.SuccessWithMessage(c, "创建成功", conversation.ToResponse())
}

// Get 获取对话详情
func (cc *ConversationController) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)
	conversationID := c.Param("id")

	var conversation models.Conversation
	if err := database.DB.Preload("Agent").Where("id = ? AND user_id = ?", conversationID, userID).First(&conversation).Error; err != nil {
		utils.NotFound(c, "对话不存在")
		return
	}

	utils.Success(c, conversation.ToResponse())
}

// Update 更新对话
func (cc *ConversationController) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	conversationID := c.Param("id")

	var conversation models.Conversation
	if err := database.DB.Where("id = ? AND user_id = ?", conversationID, userID).First(&conversation).Error; err != nil {
		utils.NotFound(c, "对话不存在")
		return
	}

	var req struct {
		Title  string                     `json:"title"`
		Status models.ConversationStatus `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误")
		return
	}

	if req.Title != "" {
		conversation.Title = req.Title
	}
	if req.Status != "" {
		conversation.Status = req.Status
	}

	if err := database.DB.Save(&conversation).Error; err != nil {
		utils.InternalServerError(c, "更新对话失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", conversation.ToResponse())
}

// Delete 删除对话
func (cc *ConversationController) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	conversationID := c.Param("id")

	var conversation models.Conversation
	if err := database.DB.Where("id = ? AND user_id = ?", conversationID, userID).First(&conversation).Error; err != nil {
		utils.NotFound(c, "对话不存在")
		return
	}

	// 软删除：标记为已删除
	conversation.Status = models.StatusDeleted
	if err := database.DB.Save(&conversation).Error; err != nil {
		utils.InternalServerError(c, "删除对话失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

// GetMessages 获取对话消息列表
func (cc *ConversationController) GetMessages(c *gin.Context) {
	userID := middleware.GetUserID(c)
	conversationID := c.Param("id")

	// 验证对话是否存在且属于当前用户
	var conversation models.Conversation
	if err := database.DB.Where("id = ? AND user_id = ?", conversationID, userID).First(&conversation).Error; err != nil {
		utils.NotFound(c, "对话不存在")
		return
	}

	var messages []models.Message
	if err := database.DB.Where("conversation_id = ?", conversationID).Order("created_at ASC").Find(&messages).Error; err != nil {
		utils.InternalServerError(c, "获取消息列表失败")
		return
	}

	var responses []models.MessageResponse
	for _, msg := range messages {
		responses = append(responses, msg.ToResponse())
	}

	utils.Success(c, responses)
}

