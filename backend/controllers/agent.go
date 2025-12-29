package controllers

import (
	"ai-chat-backend/database"
	"ai-chat-backend/middleware"
	"ai-chat-backend/models"
	"ai-chat-backend/services"
	"ai-chat-backend/utils"

	"github.com/gin-gonic/gin"
)

type AgentController struct{}

// List 获取智能体列表
func (agc *AgentController) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	showPublic := c.Query("public") == "true"

	var agents []models.Agent
	query := database.DB.Preload("APIConfig")

	if showPublic {
		query = query.Where("is_public = ?", true)
	} else {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.Order("created_at DESC").Find(&agents).Error; err != nil {
		utils.InternalServerError(c, "获取智能体列表失败")
		return
	}

	var responses []models.AgentResponse
	for _, agent := range agents {
		responses = append(responses, agent.ToResponse())
	}

	utils.Success(c, responses)
}

// Create 创建智能体
func (agc *AgentController) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.AgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	// 如果指定了API配置，验证是否属于当前用户
	if req.APIConfigID != nil {
		var apiConfig models.APIConfig
		if err := database.DB.Where("id = ? AND user_id = ?", *req.APIConfigID, userID).First(&apiConfig).Error; err != nil {
			utils.BadRequest(c, "API配置不存在或无权访问")
			return
		}
	}

	// 如果没有指定 WorkflowType，默认为 simple
	workflowType := req.WorkflowType
	if workflowType == "" {
		workflowType = models.WorkflowSimple
	}

	agent := models.Agent{
		UserID:             userID,
		Name:               req.Name,
		Description:        req.Description,
		AvatarURL:          req.AvatarURL,
		SystemPrompt:       req.SystemPrompt,
		APIConfigID:        req.APIConfigID,
		ModelName:          req.ModelName,
		ModelParams:        req.ModelParams,
		Tools:              req.Tools,
		IsPublic:           req.IsPublic,
		WorkflowType:       workflowType,
		WorkflowDefinition: req.WorkflowDefinition,
		TemplateID:         req.TemplateID,
	}

	if err := database.DB.Create(&agent).Error; err != nil {
		utils.InternalServerError(c, "创建智能体失败")
		return
	}

	// 加载关联的API配置
	database.DB.Preload("APIConfig").First(&agent, agent.ID)

	utils.SuccessWithMessage(c, "创建成功", agent.ToResponse())
}

// Get 获取智能体详情
func (agc *AgentController) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)
	agentID := c.Param("id")

	var agent models.Agent
	if err := database.DB.Preload("APIConfig").First(&agent, agentID).Error; err != nil {
		utils.NotFound(c, "智能体不存在")
		return
	}

	// 检查权限：必须是创建者或者是公开的
	if agent.UserID != userID && !agent.IsPublic {
		utils.Forbidden(c, "无权访问此智能体")
		return
	}

	utils.Success(c, agent.ToResponse())
}

// Update 更新智能体
func (agc *AgentController) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	agentID := c.Param("id")

	var agent models.Agent
	if err := database.DB.Where("id = ? AND user_id = ?", agentID, userID).First(&agent).Error; err != nil {
		utils.NotFound(c, "智能体不存在或无权访问")
		return
	}

	var req models.AgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误")
		return
	}

	// 验证API配置
	if req.APIConfigID != nil {
		var apiConfig models.APIConfig
		if err := database.DB.Where("id = ? AND user_id = ?", *req.APIConfigID, userID).First(&apiConfig).Error; err != nil {
			utils.BadRequest(c, "API配置不存在或无权访问")
			return
		}
	}

	agent.Name = req.Name
	agent.Description = req.Description
	agent.AvatarURL = req.AvatarURL
	agent.SystemPrompt = req.SystemPrompt
	agent.APIConfigID = req.APIConfigID
	agent.ModelName = req.ModelName
	agent.ModelParams = req.ModelParams
	agent.Tools = req.Tools
	agent.IsPublic = req.IsPublic

	// 更新工作流相关字段
	if req.WorkflowType != "" {
		agent.WorkflowType = req.WorkflowType
	}
	agent.WorkflowDefinition = req.WorkflowDefinition
	agent.TemplateID = req.TemplateID

	if err := database.DB.Save(&agent).Error; err != nil {
		utils.InternalServerError(c, "更新智能体失败")
		return
	}

	database.DB.Preload("APIConfig").First(&agent, agent.ID)
	utils.SuccessWithMessage(c, "更新成功", agent.ToResponse())
}

// Delete 删除智能体
func (agc *AgentController) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	agentID := c.Param("id")

	var agent models.Agent
	if err := database.DB.Where("id = ? AND user_id = ?", agentID, userID).First(&agent).Error; err != nil {
		utils.NotFound(c, "智能体不存在或无权访问")
		return
	}

	if err := database.DB.Delete(&agent).Error; err != nil {
		utils.InternalServerError(c, "删除智能体失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

// CreateFromWorkflow 从工作流创建智能体
func (agc *AgentController) CreateFromWorkflow(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		Name               string                        `json:"name" binding:"required"`
		Description        string                        `json:"description"`
		APIConfigID        *uint                         `json:"api_config_id"`
		IsPublic           bool                          `json:"is_public"`
		WorkflowDefinition models.EinoWorkflowDefinition `json:"workflow_definition" binding:"required"`
		SystemPrompt       string                        `json:"system_prompt"`
		ModelName          string                        `json:"model_name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	// 验证 API 配置
	if req.APIConfigID != nil {
		var apiConfig models.APIConfig
		if err := database.DB.Where("id = ? AND user_id = ?", *req.APIConfigID, userID).First(&apiConfig).Error; err != nil {
			utils.BadRequest(c, "API配置不存在或无权访问")
			return
		}
	}

	// 验证工作流定义
	einoService := services.NewEinoService()
	if err := einoService.ValidateWorkflowDefinition(req.WorkflowDefinition); err != nil {
		utils.BadRequest(c, "工作流验证失败: "+err.Error())
		return
	}

	// 从工作流中提取模型名称（如果有 ChatModel 节点）
	modelName := req.ModelName
	if modelName == "" {
		for _, node := range req.WorkflowDefinition.Nodes {
			if node.Type == "chatmodel" {
				if name, ok := node.Config["model_name"].(string); ok && name != "" {
					modelName = name
					break
				}
			}
		}
	}
	if modelName == "" {
		modelName = "anthropic/claude-3.5-sonnet" // 默认模型
	}

	// 创建 Agent
	agent := models.Agent{
		UserID:             userID,
		Name:               req.Name,
		Description:        req.Description,
		SystemPrompt:       req.SystemPrompt,
		APIConfigID:        req.APIConfigID,
		ModelName:          modelName,
		ModelParams:        models.ModelParams{Temperature: 0.7, MaxTokens: 2000},
		IsPublic:           req.IsPublic,
		WorkflowType:       models.WorkflowVisual,
		WorkflowDefinition: req.WorkflowDefinition,
	}

	if err := database.DB.Create(&agent).Error; err != nil {
		utils.InternalServerError(c, "创建智能体失败")
		return
	}

	// 加载关联的API配置
	database.DB.Preload("APIConfig").First(&agent, agent.ID)

	utils.SuccessWithMessage(c, "从工作流创建成功", agent.ToResponse())
}
