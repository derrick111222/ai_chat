package main

import (
	"log"

	"ai-chat-backend/config"
	"ai-chat-backend/controllers"
	"ai-chat-backend/database"
	"ai-chat-backend/middleware"
	"ai-chat-backend/models"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	config.LoadConfig()

	// 设置Gin模式
	gin.SetMode(config.AppConfig.GinMode)

	// 初始化数据库
	database.InitDB()

	// 自动迁移数据库
	database.AutoMigrate(
		&models.User{},
		&models.APIConfig{},
		&models.Agent{},
		&models.Conversation{},
		&models.Message{},
		&models.TokenUsage{},
		&models.PromptTemplate{},
	)

	// 创建路由
	r := gin.Default()

	// 应用中间件
	r.Use(middleware.ErrorHandler())
	r.Use(middleware.CORS())

	// 初始化控制器
	authCtrl := &controllers.AuthController{}
	apiConfigCtrl := &controllers.APIConfigController{}
	agentCtrl := &controllers.AgentController{}
	conversationCtrl := &controllers.ConversationController{}
	messageCtrl := &controllers.MessageController{}
	usageCtrl := &controllers.UsageController{}
	promptTemplateCtrl := &controllers.PromptTemplateController{}
	modelCtrl := &controllers.ModelController{}
	templateCtrl := controllers.NewTemplateController()

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API路由组
	api := r.Group("/api")
	{
		// 认证相关（无需token）
		auth := api.Group("/auth")
		{
			auth.POST("/register", authCtrl.Register)
			auth.POST("/login", authCtrl.Login)
		}

		// 公开的 API（无需认证）
		api.GET("/models", modelCtrl.GetModels) // 获取模型列表
		
		// Agent 模板相关（公开访问）
		api.GET("/agent-templates", templateCtrl.ListTemplates)
		api.GET("/agent-templates/categories", templateCtrl.GetCategories)
		api.GET("/agent-templates/:id", templateCtrl.GetTemplate)

		// 需要认证的路由
		authorized := api.Group("")
		authorized.Use(middleware.AuthRequired())
		{
			// 用户信息
			authorized.GET("/auth/profile", authCtrl.GetProfile)
			authorized.PUT("/auth/profile", authCtrl.UpdateProfile)

			// API配置管理
			configs := authorized.Group("/configs")
			{
				configs.GET("", apiConfigCtrl.List)
				configs.POST("", apiConfigCtrl.Create)
				configs.GET("/:id", apiConfigCtrl.Get)
				configs.PUT("/:id", apiConfigCtrl.Update)
				configs.DELETE("/:id", apiConfigCtrl.Delete)
			}

			// 智能体管理
			agents := authorized.Group("/agents")
			{
				agents.GET("", agentCtrl.List)
				agents.POST("", agentCtrl.Create)
				agents.POST("/from-template", templateCtrl.CreateAgentFromTemplate) // 从模板创建
				agents.POST("/from-workflow", agentCtrl.CreateFromWorkflow)         // 从工作流创建
				agents.GET("/:id", agentCtrl.Get)
				agents.PUT("/:id", agentCtrl.Update)
				agents.DELETE("/:id", agentCtrl.Delete)
			}

			// 对话管理
			conversations := authorized.Group("/conversations")
			{
				conversations.GET("", conversationCtrl.List)
				conversations.POST("", conversationCtrl.Create)
				conversations.GET("/:id", conversationCtrl.Get)
				conversations.PUT("/:id", conversationCtrl.Update)
				conversations.DELETE("/:id", conversationCtrl.Delete)
				conversations.GET("/:id/messages", conversationCtrl.GetMessages)

				// 消息相关
				conversations.POST("/:id/messages", messageCtrl.SendMessage)
				conversations.POST("/:id/stream", messageCtrl.StreamMessage)
			}

			// 消息操作
			authorized.DELETE("/messages/:id", messageCtrl.DeleteMessage)

			// 使用统计
			usage := authorized.Group("/usage")
			{
				usage.GET("/stats", usageCtrl.GetStats)
				usage.GET("/daily", usageCtrl.GetDailyUsage)
				usage.GET("/by-agent", usageCtrl.GetByAgent)
			}

			// 提示词模板管理
			templates := authorized.Group("/templates")
			{
				templates.GET("", promptTemplateCtrl.List)
				templates.POST("", promptTemplateCtrl.Create)
				templates.GET("/:id", promptTemplateCtrl.Get)
				templates.PUT("/:id", promptTemplateCtrl.Update)
				templates.DELETE("/:id", promptTemplateCtrl.Delete)
				templates.POST("/:id/use", promptTemplateCtrl.Use)
			}
		}
	}

	// 启动服务器
	addr := ":" + config.AppConfig.ServerPort
	log.Printf("Server is running on http://localhost%s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
