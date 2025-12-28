package controllers

import (
	"encoding/json"
	"io"
	"net/http"
	"time"

	"ai-chat-backend/utils"

	"github.com/gin-gonic/gin"
)

type ModelController struct{}

// OpenRouter 模型响应结构
type OpenRouterModel struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Pricing     struct {
		Prompt     string `json:"prompt"`
		Completion string `json:"completion"`
	} `json:"pricing"`
	ContextLength int `json:"context_length"`
	Architecture  struct {
		Modality string `json:"modality"`
	} `json:"architecture"`
	TopProvider struct {
		MaxCompletionTokens int `json:"max_completion_tokens"`
	} `json:"top_provider"`
}

type OpenRouterResponse struct {
	Data []OpenRouterModel `json:"data"`
}

// GetModels 获取可用模型列表
func (mc *ModelController) GetModels(c *gin.Context) {
	provider := c.DefaultQuery("provider", "openrouter")

	switch provider {
	case "openrouter":
		mc.getOpenRouterModels(c)
	case "openai":
		mc.getOpenAIModels(c)
	case "anthropic":
		mc.getAnthropicModels(c)
	case "google":
		mc.getGoogleModels(c)
	case "meta":
		mc.getMetaModels(c)
	default:
		// 返回默认模型列表
		mc.getDefaultModels(c)
	}
}

// getOpenRouterModels 从 OpenRouter 获取模型列表
func (mc *ModelController) getOpenRouterModels(c *gin.Context) {
	// 创建 HTTP 客户端
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// 请求 OpenRouter API
	req, err := http.NewRequest("GET", "https://openrouter.ai/api/v1/models", nil)
	if err != nil {
		utils.InternalServerError(c, "创建请求失败: "+err.Error())
		return
	}

	resp, err := client.Do(req)
	if err != nil {
		utils.InternalServerError(c, "获取模型列表失败: "+err.Error())
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		utils.InternalServerError(c, "读取响应失败: "+err.Error())
		return
	}

	var openRouterResp OpenRouterResponse
	if err := json.Unmarshal(body, &openRouterResp); err != nil {
		utils.InternalServerError(c, "解析响应失败: "+err.Error())
		return
	}

	// 转换为简化的模型列表
	models := make([]map[string]interface{}, 0)
	for _, model := range openRouterResp.Data {
		models = append(models, map[string]interface{}{
			"id":             model.ID,
			"name":           model.Name,
			"description":    model.Description,
			"context_length": model.ContextLength,
			"pricing": map[string]string{
				"prompt":     model.Pricing.Prompt,
				"completion": model.Pricing.Completion,
			},
		})
	}

	utils.Success(c, models)
}

// getOpenAIModels 获取 OpenAI 模型列表
func (mc *ModelController) getOpenAIModels(c *gin.Context) {
	models := []map[string]interface{}{
		{
			"id":             "gpt-4-turbo-preview",
			"name":           "GPT-4 Turbo Preview",
			"description":    "最新的 GPT-4 Turbo 模型，支持 128K 上下文",
			"context_length": 128000,
		},
		{
			"id":             "gpt-4",
			"name":           "GPT-4",
			"description":    "OpenAI 最强大的模型，适合复杂任务",
			"context_length": 8192,
		},
		{
			"id":             "gpt-4-32k",
			"name":           "GPT-4 32K",
			"description":    "支持 32K 上下文的 GPT-4",
			"context_length": 32768,
		},
		{
			"id":             "gpt-3.5-turbo",
			"name":           "GPT-3.5 Turbo",
			"description":    "快速且经济的模型",
			"context_length": 16385,
		},
		{
			"id":             "gpt-3.5-turbo-16k",
			"name":           "GPT-3.5 Turbo 16K",
			"description":    "支持 16K 上下文的 GPT-3.5",
			"context_length": 16385,
		},
	}
	utils.Success(c, models)
}

// getAnthropicModels 获取 Anthropic 模型列表
func (mc *ModelController) getAnthropicModels(c *gin.Context) {
	models := []map[string]interface{}{
		{
			"id":             "claude-3-opus-20240229",
			"name":           "Claude 3 Opus",
			"description":    "最强大的 Claude 模型，适合复杂任务",
			"context_length": 200000,
		},
		{
			"id":             "claude-3-sonnet-20240229",
			"name":           "Claude 3 Sonnet",
			"description":    "平衡性能和速度的模型",
			"context_length": 200000,
		},
		{
			"id":             "claude-3-haiku-20240307",
			"name":           "Claude 3 Haiku",
			"description":    "最快速的 Claude 模型",
			"context_length": 200000,
		},
		{
			"id":             "claude-2.1",
			"name":           "Claude 2.1",
			"description":    "上一代 Claude 模型",
			"context_length": 200000,
		},
		{
			"id":             "claude-2.0",
			"name":           "Claude 2.0",
			"description":    "稳定的 Claude 2.0 版本",
			"context_length": 100000,
		},
	}
	utils.Success(c, models)
}

// getGoogleModels 获取 Google 模型列表
func (mc *ModelController) getGoogleModels(c *gin.Context) {
	models := []map[string]interface{}{
		{
			"id":             "gemini-pro",
			"name":           "Gemini Pro",
			"description":    "Google 的多模态 AI 模型",
			"context_length": 32768,
		},
		{
			"id":             "gemini-pro-vision",
			"name":           "Gemini Pro Vision",
			"description":    "支持图像理解的 Gemini Pro",
			"context_length": 16384,
		},
		{
			"id":             "gemini-ultra",
			"name":           "Gemini Ultra",
			"description":    "Google 最强大的 AI 模型",
			"context_length": 32768,
		},
	}
	utils.Success(c, models)
}

// getMetaModels 获取 Meta 模型列表
func (mc *ModelController) getMetaModels(c *gin.Context) {
	models := []map[string]interface{}{
		{
			"id":             "llama-3-70b-instruct",
			"name":           "Llama 3 70B Instruct",
			"description":    "Meta 的大型指令微调模型",
			"context_length": 8192,
		},
		{
			"id":             "llama-3-8b-instruct",
			"name":           "Llama 3 8B Instruct",
			"description":    "轻量级的 Llama 3 模型",
			"context_length": 8192,
		},
		{
			"id":             "llama-2-70b-chat",
			"name":           "Llama 2 70B Chat",
			"description":    "Llama 2 对话模型",
			"context_length": 4096,
		},
		{
			"id":             "llama-2-13b-chat",
			"name":           "Llama 2 13B Chat",
			"description":    "中等规模的 Llama 2 模型",
			"context_length": 4096,
		},
		{
			"id":             "llama-2-7b-chat",
			"name":           "Llama 2 7B Chat",
			"description":    "小型的 Llama 2 模型",
			"context_length": 4096,
		},
	}
	utils.Success(c, models)
}

// getDefaultModels 返回默认模型列表
func (mc *ModelController) getDefaultModels(c *gin.Context) {
	models := []map[string]interface{}{
		{
			"id":          "anthropic/claude-3.5-sonnet",
			"name":        "Claude 3.5 Sonnet",
			"description": "Anthropic's most intelligent model",
		},
		{
			"id":          "anthropic/claude-3-opus",
			"name":        "Claude 3 Opus",
			"description": "Powerful model for complex tasks",
		},
		{
			"id":          "openai/gpt-4-turbo",
			"name":        "GPT-4 Turbo",
			"description": "OpenAI's latest GPT-4 model",
		},
		{
			"id":          "openai/gpt-4",
			"name":        "GPT-4",
			"description": "OpenAI's most capable model",
		},
		{
			"id":          "openai/gpt-3.5-turbo",
			"name":        "GPT-3.5 Turbo",
			"description": "Fast and efficient model",
		},
		{
			"id":          "google/gemini-pro",
			"name":        "Gemini Pro",
			"description": "Google's multimodal AI model",
		},
		{
			"id":          "meta-llama/llama-3-70b",
			"name":        "Llama 3 70B",
			"description": "Meta's open source model",
		},
	}

	utils.Success(c, models)
}
