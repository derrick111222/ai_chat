package services

import (
	"ai-chat-backend/models"
	"errors"
	"fmt"
)

// TemplateService 模板服务
type TemplateService struct {
	templates map[string]models.AgentTemplate
}

// NewTemplateService 创建模板服务
func NewTemplateService() *TemplateService {
	service := &TemplateService{
		templates: make(map[string]models.AgentTemplate),
	}
	
	// 初始化内置模板
	service.initBuiltInTemplates()
	
	return service
}

// initBuiltInTemplates 初始化内置模板
func (s *TemplateService) initBuiltInTemplates() {
	// 1. 简单对话 Agent
	s.templates["simple_chat"] = models.AgentTemplate{
		ID:          "simple_chat",
		Name:        "简单对话助手",
		Description: "一个基础的对话助手，适合日常交流和问答",
		Category:    "conversation",
		Icon:        "💬",
		Tags:        []string{"对话", "通用", "简单"},
		DefaultSystemPrompt: "你是一个友好、专业的AI助手。请用简洁、准确的语言回答用户的问题。",
		DefaultModelName:    "anthropic/claude-3.5-sonnet",
		DefaultModelParams: models.ModelParams{
			Temperature: 0.7,
			MaxTokens:   2000,
		},
		ConfigurableParams: []models.TemplateParam{
			{
				Name:         "personality",
				Label:        "性格特点",
				Type:         "select",
				Description:  "选择助手的性格特点",
				DefaultValue: "friendly",
				Required:     false,
				Options: []models.ParamOption{
					{Label: "友好热情", Value: "friendly"},
					{Label: "专业严谨", Value: "professional"},
					{Label: "幽默风趣", Value: "humorous"},
					{Label: "简洁高效", Value: "concise"},
				},
			},
			{
				Name:         "language_style",
				Label:        "语言风格",
				Type:         "select",
				Description:  "选择回答的语言风格",
				DefaultValue: "balanced",
				Required:     false,
				Options: []models.ParamOption{
					{Label: "平衡", Value: "balanced"},
					{Label: "详细", Value: "detailed"},
					{Label: "简短", Value: "brief"},
				},
			},
		},
		WorkflowDefinition: models.EinoWorkflowDefinition{
			Nodes: []models.WorkflowNode{
				{
					ID:   "start",
					Type: "chatmodel",
					Config: map[string]interface{}{
						"type": "simple_chat",
					},
				},
			},
			Edges: []models.WorkflowEdge{},
		},
		Author:     "System",
		Version:    "1.0.0",
		IsBuiltIn:  true,
		UsageCount: 0,
	}

	// 2. 编程助手
	s.templates["coding_assistant"] = models.AgentTemplate{
		ID:          "coding_assistant",
		Name:        "编程助手",
		Description: "专业的编程助手，帮助你编写、调试和优化代码",
		Category:    "tool_calling",
		Icon:        "💻",
		Tags:        []string{"编程", "代码", "技术"},
		DefaultSystemPrompt: `你是一个专业的编程助手。你擅长：
1. 编写高质量、可维护的代码
2. 解释复杂的技术概念
3. 调试和优化代码
4. 提供最佳实践建议

请用清晰的语言解释技术问题，并提供可运行的代码示例。`,
		DefaultModelName: "anthropic/claude-3.5-sonnet",
		DefaultModelParams: models.ModelParams{
			Temperature: 0.3, // 更低的温度以获得更精确的代码
			MaxTokens:   4000,
		},
		ConfigurableParams: []models.TemplateParam{
			{
				Name:         "programming_languages",
				Label:        "主要编程语言",
				Type:         "multiselect",
				Description:  "选择你主要使用的编程语言",
				DefaultValue: []string{"Python", "JavaScript"},
				Required:     false,
				Options: []models.ParamOption{
					{Label: "Python", Value: "Python"},
					{Label: "JavaScript", Value: "JavaScript"},
					{Label: "Go", Value: "Go"},
					{Label: "Java", Value: "Java"},
					{Label: "TypeScript", Value: "TypeScript"},
					{Label: "C++", Value: "C++"},
					{Label: "Rust", Value: "Rust"},
				},
			},
			{
				Name:         "code_style",
				Label:        "代码风格",
				Type:         "select",
				Description:  "选择代码注释和解释的详细程度",
				DefaultValue: "balanced",
				Required:     false,
				Options: []models.ParamOption{
					{Label: "详细注释", Value: "verbose"},
					{Label: "适度注释", Value: "balanced"},
					{Label: "简洁代码", Value: "minimal"},
				},
			},
		},
		WorkflowDefinition: models.EinoWorkflowDefinition{
			Nodes: []models.WorkflowNode{
				{
					ID:   "code_chat",
					Type: "chatmodel",
					Config: map[string]interface{}{
						"type": "coding_assistant",
					},
				},
			},
			Edges: []models.WorkflowEdge{},
		},
		Author:     "System",
		Version:    "1.0.0",
		IsBuiltIn:  true,
		UsageCount: 0,
	}

	// 3. 文档写作助手
	s.templates["writing_assistant"] = models.AgentTemplate{
		ID:          "writing_assistant",
		Name:        "文档写作助手",
		Description: "帮助你撰写、润色和优化各类文档",
		Category:    "conversation",
		Icon:        "📝",
		Tags:        []string{"写作", "文档", "润色"},
		DefaultSystemPrompt: `你是一个专业的写作助手。你擅长：
1. 撰写清晰、结构化的文档
2. 润色和改进文字表达
3. 调整语气和风格
4. 检查语法和拼写

请根据用户需求提供专业的写作建议和修改意见。`,
		DefaultModelName: "anthropic/claude-3.5-sonnet",
		DefaultModelParams: models.ModelParams{
			Temperature: 0.8, // 更高的温度以获得更有创意的表达
			MaxTokens:   3000,
		},
		ConfigurableParams: []models.TemplateParam{
			{
				Name:         "document_type",
				Label:        "文档类型",
				Type:         "select",
				Description:  "选择主要处理的文档类型",
				DefaultValue: "general",
				Required:     false,
				Options: []models.ParamOption{
					{Label: "通用文档", Value: "general"},
					{Label: "技术文档", Value: "technical"},
					{Label: "商业文档", Value: "business"},
					{Label: "学术论文", Value: "academic"},
					{Label: "创意写作", Value: "creative"},
				},
			},
			{
				Name:         "tone",
				Label:        "语气风格",
				Type:         "select",
				Description:  "选择文档的语气风格",
				DefaultValue: "professional",
				Required:     false,
				Options: []models.ParamOption{
					{Label: "专业正式", Value: "professional"},
					{Label: "友好亲切", Value: "friendly"},
					{Label: "简洁直接", Value: "direct"},
					{Label: "学术严谨", Value: "academic"},
				},
			},
		},
		WorkflowDefinition: models.EinoWorkflowDefinition{
			Nodes: []models.WorkflowNode{
				{
					ID:   "writing_chat",
					Type: "chatmodel",
					Config: map[string]interface{}{
						"type": "writing_assistant",
					},
				},
			},
			Edges: []models.WorkflowEdge{},
		},
		Author:     "System",
		Version:    "1.0.0",
		IsBuiltIn:  true,
		UsageCount: 0,
	}

	// 4. 数据分析助手
	s.templates["data_analyst"] = models.AgentTemplate{
		ID:          "data_analyst",
		Name:        "数据分析助手",
		Description: "帮助你分析数据、生成图表和提供洞察",
		Category:    "tool_calling",
		Icon:        "📊",
		Tags:        []string{"数据", "分析", "可视化"},
		DefaultSystemPrompt: `你是一个专业的数据分析助手。你擅长：
1. 分析和解释数据
2. 提供数据洞察和建议
3. 推荐合适的分析方法
4. 解释统计概念

请用清晰的语言解释数据分析结果，并提供可操作的建议。`,
		DefaultModelName: "anthropic/claude-3.5-sonnet",
		DefaultModelParams: models.ModelParams{
			Temperature: 0.4,
			MaxTokens:   3000,
		},
		ConfigurableParams: []models.TemplateParam{
			{
				Name:         "analysis_focus",
				Label:        "分析重点",
				Type:         "select",
				Description:  "选择主要的分析方向",
				DefaultValue: "general",
				Required:     false,
				Options: []models.ParamOption{
					{Label: "综合分析", Value: "general"},
					{Label: "趋势分析", Value: "trend"},
					{Label: "对比分析", Value: "comparison"},
					{Label: "预测分析", Value: "prediction"},
				},
			},
		},
		WorkflowDefinition: models.EinoWorkflowDefinition{
			Nodes: []models.WorkflowNode{
				{
					ID:   "analyst_chat",
					Type: "chatmodel",
					Config: map[string]interface{}{
						"type": "data_analyst",
					},
				},
			},
			Edges: []models.WorkflowEdge{},
		},
		Author:     "System",
		Version:    "1.0.0",
		IsBuiltIn:  true,
		UsageCount: 0,
	}

	// 5. 翻译助手
	s.templates["translator"] = models.AgentTemplate{
		ID:          "translator",
		Name:        "翻译助手",
		Description: "专业的多语言翻译助手，支持多种语言互译",
		Category:    "conversation",
		Icon:        "🌐",
		Tags:        []string{"翻译", "语言", "国际化"},
		DefaultSystemPrompt: `你是一个专业的翻译助手。你擅长：
1. 准确翻译多种语言
2. 保持原文的语气和风格
3. 解释文化差异和习语
4. 提供多种翻译选项

请提供准确、自然的翻译，并在必要时解释翻译选择。`,
		DefaultModelName: "anthropic/claude-3.5-sonnet",
		DefaultModelParams: models.ModelParams{
			Temperature: 0.3,
			MaxTokens:   2000,
		},
		ConfigurableParams: []models.TemplateParam{
			{
				Name:         "source_language",
				Label:        "源语言",
				Type:         "select",
				Description:  "选择主要的源语言",
				DefaultValue: "auto",
				Required:     false,
				Options: []models.ParamOption{
					{Label: "自动检测", Value: "auto"},
					{Label: "中文", Value: "zh"},
					{Label: "英语", Value: "en"},
					{Label: "日语", Value: "ja"},
					{Label: "韩语", Value: "ko"},
					{Label: "法语", Value: "fr"},
					{Label: "德语", Value: "de"},
					{Label: "西班牙语", Value: "es"},
				},
			},
			{
				Name:         "target_language",
				Label:        "目标语言",
				Type:         "select",
				Description:  "选择主要的目标语言",
				DefaultValue: "en",
				Required:     false,
				Options: []models.ParamOption{
					{Label: "中文", Value: "zh"},
					{Label: "英语", Value: "en"},
					{Label: "日语", Value: "ja"},
					{Label: "韩语", Value: "ko"},
					{Label: "法语", Value: "fr"},
					{Label: "德语", Value: "de"},
					{Label: "西班牙语", Value: "es"},
				},
			},
			{
				Name:         "formality",
				Label:        "正式程度",
				Type:         "select",
				Description:  "选择翻译的正式程度",
				DefaultValue: "balanced",
				Required:     false,
				Options: []models.ParamOption{
					{Label: "正式", Value: "formal"},
					{Label: "平衡", Value: "balanced"},
					{Label: "口语化", Value: "casual"},
				},
			},
		},
		WorkflowDefinition: models.EinoWorkflowDefinition{
			Nodes: []models.WorkflowNode{
				{
					ID:   "translator_chat",
					Type: "chatmodel",
					Config: map[string]interface{}{
						"type": "translator",
					},
				},
			},
			Edges: []models.WorkflowEdge{},
		},
		Author:     "System",
		Version:    "1.0.0",
		IsBuiltIn:  true,
		UsageCount: 0,
	}
}

// GetAllTemplates 获取所有模板
func (s *TemplateService) GetAllTemplates() []models.AgentTemplate {
	templates := make([]models.AgentTemplate, 0, len(s.templates))
	for _, template := range s.templates {
		templates = append(templates, template)
	}
	return templates
}

// GetTemplateByID 根据ID获取模板
func (s *TemplateService) GetTemplateByID(id string) (*models.AgentTemplate, error) {
	template, exists := s.templates[id]
	if !exists {
		return nil, errors.New("模板不存在")
	}
	return &template, nil
}

// GetTemplatesByCategory 根据分类获取模板
func (s *TemplateService) GetTemplatesByCategory(category string) []models.AgentTemplate {
	templates := make([]models.AgentTemplate, 0)
	for _, template := range s.templates {
		if template.Category == category {
			templates = append(templates, template)
		}
	}
	return templates
}

// GetCategories 获取所有分类
func (s *TemplateService) GetCategories() []models.TemplateCategory {
	categories := []models.TemplateCategory{
		{
			ID:          "conversation",
			Name:        "对话助手",
			Description: "通用对话和交流场景",
			Icon:        "💬",
		},
		{
			ID:          "tool_calling",
			Name:        "工具调用",
			Description: "需要调用外部工具的场景",
			Icon:        "🔧",
		},
		{
			ID:          "rag",
			Name:        "知识检索",
			Description: "基于知识库的问答",
			Icon:        "📚",
		},
		{
			ID:          "react",
			Name:        "推理决策",
			Description: "需要多步推理的复杂任务",
			Icon:        "🧠",
		},
	}
	
	// 统计每个分类的模板数量
	for i := range categories {
		count := 0
		for _, template := range s.templates {
			if template.Category == categories[i].ID {
				count++
			}
		}
		categories[i].Count = count
	}
	
	return categories
}

// CreateAgentFromTemplate 从模板创建 Agent
func (s *TemplateService) CreateAgentFromTemplate(req models.AgentTemplateRequest) (*models.Agent, error) {
	// 获取模板
	template, err := s.GetTemplateByID(req.TemplateID)
	if err != nil {
		return nil, err
	}
	
	// 构建系统提示词（根据用户参数定制）
	systemPrompt := s.buildSystemPrompt(template, req.Params)
	
	// 创建 Agent
	agent := &models.Agent{
		Name:               req.Name,
		Description:        req.Description,
		SystemPrompt:       systemPrompt,
		APIConfigID:        req.APIConfigID,
		ModelName:          template.DefaultModelName,
		ModelParams:        template.DefaultModelParams,
		Tools:              models.Tools(template.RequiredTools),
		IsPublic:           req.IsPublic,
		WorkflowType:       models.WorkflowTemplate,
		WorkflowDefinition: template.WorkflowDefinition,
		TemplateID:         template.ID,
	}
	
	return agent, nil
}

// buildSystemPrompt 根据模板和参数构建系统提示词
func (s *TemplateService) buildSystemPrompt(template *models.AgentTemplate, params map[string]interface{}) string {
	systemPrompt := template.DefaultSystemPrompt
	
	// 根据不同模板类型和参数定制提示词
	switch template.ID {
	case "simple_chat":
		if personality, ok := params["personality"].(string); ok {
			systemPrompt = s.applyPersonality(systemPrompt, personality)
		}
		if style, ok := params["language_style"].(string); ok {
			systemPrompt = s.applyLanguageStyle(systemPrompt, style)
		}
		
	case "coding_assistant":
		if langs, ok := params["programming_languages"].([]interface{}); ok {
			langStr := ""
			for i, lang := range langs {
				if i > 0 {
					langStr += "、"
				}
				langStr += fmt.Sprintf("%v", lang)
			}
			if langStr != "" {
				systemPrompt += fmt.Sprintf("\n\n你特别擅长以下编程语言：%s", langStr)
			}
		}
		
	case "translator":
		if source, ok := params["source_language"].(string); ok {
			if target, ok := params["target_language"].(string); ok {
				systemPrompt += fmt.Sprintf("\n\n主要翻译方向：%s → %s", source, target)
			}
		}
	}
	
	return systemPrompt
}

// applyPersonality 应用性格特点
func (s *TemplateService) applyPersonality(prompt string, personality string) string {
	switch personality {
	case "friendly":
		return prompt + "\n\n请保持友好、热情的态度，让用户感到舒适。"
	case "professional":
		return prompt + "\n\n请保持专业、严谨的态度，注重准确性和可靠性。"
	case "humorous":
		return prompt + "\n\n可以适当使用幽默，让对话更加轻松愉快。"
	case "concise":
		return prompt + "\n\n请保持简洁高效，直接给出关键信息。"
	default:
		return prompt
	}
}

// applyLanguageStyle 应用语言风格
func (s *TemplateService) applyLanguageStyle(prompt string, style string) string {
	switch style {
	case "detailed":
		return prompt + "\n\n请提供详细、全面的回答，包含必要的背景信息和解释。"
	case "brief":
		return prompt + "\n\n请保持回答简短，只提供核心信息。"
	default:
		return prompt
	}
}

// ValidateTemplateParams 验证模板参数
func (s *TemplateService) ValidateTemplateParams(templateID string, params map[string]interface{}) error {
	template, err := s.GetTemplateByID(templateID)
	if err != nil {
		return err
	}
	
	// 检查必填参数
	for _, param := range template.ConfigurableParams {
		if param.Required {
			if _, exists := params[param.Name]; !exists {
				return fmt.Errorf("缺少必填参数: %s", param.Label)
			}
		}
	}
	
	return nil
}

