package controllers

import (
	"ai-chat-backend/database"
	"ai-chat-backend/middleware"
	"ai-chat-backend/models"
	"ai-chat-backend/services"
	"ai-chat-backend/utils"

	"github.com/gin-gonic/gin"
)

type TemplateController struct {
	templateService *services.TemplateService
}

func NewTemplateController() *TemplateController {
	return &TemplateController{
		templateService: services.NewTemplateService(),
	}
}

// ListTemplates 获取模板列表
func (tc *TemplateController) ListTemplates(c *gin.Context) {
	category := c.Query("category")
	
	var templates []models.AgentTemplate
	if category != "" {
		templates = tc.templateService.GetTemplatesByCategory(category)
	} else {
		templates = tc.templateService.GetAllTemplates()
	}
	
	utils.Success(c, gin.H{
		"templates": templates,
		"total":     len(templates),
	})
}

// GetTemplate 获取模板详情
func (tc *TemplateController) GetTemplate(c *gin.Context) {
	templateID := c.Param("id")
	
	template, err := tc.templateService.GetTemplateByID(templateID)
	if err != nil {
		utils.NotFound(c, "模板不存在")
		return
	}
	
	utils.Success(c, template)
}

// GetCategories 获取模板分类
func (tc *TemplateController) GetCategories(c *gin.Context) {
	categories := tc.templateService.GetCategories()
	utils.Success(c, categories)
}

// CreateAgentFromTemplate 从模板创建 Agent
func (tc *TemplateController) CreateAgentFromTemplate(c *gin.Context) {
	userID := middleware.GetUserID(c)
	
	var req models.AgentTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}
	
	// 验证参数
	if err := tc.templateService.ValidateTemplateParams(req.TemplateID, req.Params); err != nil {
		utils.BadRequest(c, "参数验证失败: "+err.Error())
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
	
	// 从模板创建 Agent
	agent, err := tc.templateService.CreateAgentFromTemplate(req)
	if err != nil {
		utils.InternalServerError(c, "创建Agent失败: "+err.Error())
		return
	}
	
	// 设置用户ID
	agent.UserID = userID
	
	// 保存到数据库
	if err := database.DB.Create(agent).Error; err != nil {
		utils.InternalServerError(c, "保存Agent失败")
		return
	}
	
	// 加载关联的API配置
	database.DB.Preload("APIConfig").First(agent, agent.ID)
	
	utils.SuccessWithMessage(c, "创建成功", agent.ToResponse())
}

