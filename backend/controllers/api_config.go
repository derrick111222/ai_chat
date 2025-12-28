package controllers

import (
	"ai-chat-backend/database"
	"ai-chat-backend/middleware"
	"ai-chat-backend/models"
	"ai-chat-backend/utils"
	"github.com/gin-gonic/gin"
)

type APIConfigController struct{}

// List 获取API配置列表
func (acc *APIConfigController) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var configs []models.APIConfig
	if err := database.DB.Where("user_id = ?", userID).Find(&configs).Error; err != nil {
		utils.InternalServerError(c, "获取配置列表失败")
		return
	}

	var responses []models.APIConfigResponse
	for _, config := range configs {
		responses = append(responses, config.ToResponse())
	}

	utils.Success(c, responses)
}

// Create 创建API配置
func (acc *APIConfigController) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.APIConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	config := models.APIConfig{
		UserID:       userID,
		Name:         req.Name,
		APIType:      req.APIType,
		EndpointURL:  req.EndpointURL,
		AuthType:     req.AuthType,
		Credentials:  req.Credentials, // TODO: 应该加密存储
		FieldMapping: req.FieldMapping,
		IsActive:     req.IsActive,
	}

	if err := database.DB.Create(&config).Error; err != nil {
		utils.InternalServerError(c, "创建配置失败")
		return
	}

	utils.SuccessWithMessage(c, "创建成功", config.ToResponse())
}

// Get 获取API配置详情
func (acc *APIConfigController) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)
	configID := c.Param("id")

	var config models.APIConfig
	if err := database.DB.Where("id = ? AND user_id = ?", configID, userID).First(&config).Error; err != nil {
		utils.NotFound(c, "配置不存在")
		return
	}

	utils.Success(c, config.ToResponse())
}

// Update 更新API配置
func (acc *APIConfigController) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	configID := c.Param("id")

	var config models.APIConfig
	if err := database.DB.Where("id = ? AND user_id = ?", configID, userID).First(&config).Error; err != nil {
		utils.NotFound(c, "配置不存在")
		return
	}

	var req models.APIConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误")
		return
	}

	config.Name = req.Name
	config.APIType = req.APIType
	config.EndpointURL = req.EndpointURL
	config.AuthType = req.AuthType
	if req.Credentials != "" {
		config.Credentials = req.Credentials
	}
	config.FieldMapping = req.FieldMapping
	config.IsActive = req.IsActive

	if err := database.DB.Save(&config).Error; err != nil {
		utils.InternalServerError(c, "更新配置失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", config.ToResponse())
}

// Delete 删除API配置
func (acc *APIConfigController) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	configID := c.Param("id")

	var config models.APIConfig
	if err := database.DB.Where("id = ? AND user_id = ?", configID, userID).First(&config).Error; err != nil {
		utils.NotFound(c, "配置不存在")
		return
	}

	if err := database.DB.Delete(&config).Error; err != nil {
		utils.InternalServerError(c, "删除配置失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

