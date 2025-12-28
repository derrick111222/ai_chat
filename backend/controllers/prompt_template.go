package controllers

import (
	"ai-chat-backend/database"
	"ai-chat-backend/middleware"
	"ai-chat-backend/models"
	"ai-chat-backend/utils"
	"github.com/gin-gonic/gin"
)

type PromptTemplateController struct{}

// List 获取提示词模板列表
func (ptc *PromptTemplateController) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	showPublic := c.Query("public") == "true"
	category := c.Query("category")

	var templates []models.PromptTemplate
	query := database.DB.Model(&models.PromptTemplate{})

	if showPublic {
		query = query.Where("is_public = ?", true)
	} else {
		query = query.Where("user_id = ? OR is_public = ?", userID, true)
	}

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if err := query.Order("usage_count DESC, created_at DESC").Find(&templates).Error; err != nil {
		utils.InternalServerError(c, "获取模板列表失败")
		return
	}

	var responses []models.PromptTemplateResponse
	for _, template := range templates {
		responses = append(responses, template.ToResponse())
	}

	utils.Success(c, responses)
}

// Create 创建提示词模板
func (ptc *PromptTemplateController) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.PromptTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	template := models.PromptTemplate{
		UserID:      &userID,
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Content:     req.Content,
		Variables:   req.Variables,
		IsPublic:    req.IsPublic,
	}

	if err := database.DB.Create(&template).Error; err != nil {
		utils.InternalServerError(c, "创建模板失败")
		return
	}

	utils.SuccessWithMessage(c, "创建成功", template.ToResponse())
}

// Get 获取提示词模板详情
func (ptc *PromptTemplateController) Get(c *gin.Context) {
	templateID := c.Param("id")

	var template models.PromptTemplate
	if err := database.DB.First(&template, templateID).Error; err != nil {
		utils.NotFound(c, "模板不存在")
		return
	}

	utils.Success(c, template.ToResponse())
}

// Update 更新提示词模板
func (ptc *PromptTemplateController) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	templateID := c.Param("id")

	var template models.PromptTemplate
	if err := database.DB.First(&template, templateID).Error; err != nil {
		utils.NotFound(c, "模板不存在")
		return
	}

	// 检查权限
	if template.UserID == nil || *template.UserID != userID {
		utils.Forbidden(c, "无权修改此模板")
		return
	}

	var req models.PromptTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误")
		return
	}

	template.Name = req.Name
	template.Description = req.Description
	template.Category = req.Category
	template.Content = req.Content
	template.Variables = req.Variables
	template.IsPublic = req.IsPublic

	if err := database.DB.Save(&template).Error; err != nil {
		utils.InternalServerError(c, "更新模板失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", template.ToResponse())
}

// Delete 删除提示词模板
func (ptc *PromptTemplateController) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	templateID := c.Param("id")

	var template models.PromptTemplate
	if err := database.DB.First(&template, templateID).Error; err != nil {
		utils.NotFound(c, "模板不存在")
		return
	}

	// 检查权限
	if template.UserID == nil || *template.UserID != userID {
		utils.Forbidden(c, "无权删除此模板")
		return
	}

	if err := database.DB.Delete(&template).Error; err != nil {
		utils.InternalServerError(c, "删除模板失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

// Use 使用模板（增加使用次数）
func (ptc *PromptTemplateController) Use(c *gin.Context) {
	templateID := c.Param("id")

	var template models.PromptTemplate
	if err := database.DB.First(&template, templateID).Error; err != nil {
		utils.NotFound(c, "模板不存在")
		return
	}

	template.UsageCount++
	database.DB.Save(&template)

	utils.Success(c, template.ToResponse())
}

