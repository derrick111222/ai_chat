package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"ai-chat-backend/models"
)

type AIService struct {
	client *http.Client
}

func NewAIService() *AIService {
	return &AIService{
		client: &http.Client{},
	}
}

// Chat 非流式对话
func (s *AIService) Chat(agent models.Agent, messages []models.Message) (string, int, int, error) {
	// 构建请求
	req, err := s.buildRequest(agent, messages, false)
	if err != nil {
		return "", 0, 0, err
	}

	// 发送请求
	resp, err := s.client.Do(req)
	if err != nil {
		return "", 0, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", 0, 0, fmt.Errorf("API请求失败: %s", string(body))
	}

	// 解析响应
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", 0, 0, err
	}

	// 提取内容
	content, err := s.extractContent(result)
	if err != nil {
		return "", 0, 0, err
	}

	// 提取Token使用量
	inputTokens, outputTokens := s.extractTokens(result)

	return content, inputTokens, outputTokens, nil
}

// ChatStream 流式对话
func (s *AIService) ChatStream(agent models.Agent, messages []models.Message) (io.ReadCloser, error) {
	// 构建请求
	req, err := s.buildRequest(agent, messages, true)
	if err != nil {
		return nil, err
	}

	// 发送请求
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("API请求失败: %s", string(body))
	}

	return resp.Body, nil
}

// buildRequest 构建API请求
func (s *AIService) buildRequest(agent models.Agent, messages []models.Message, stream bool) (*http.Request, error) {
	// 获取API配置
	var apiConfig *models.APIConfig
	var endpointURL string
	var apiKey string

	// 检查是否配置了 API
	if agent.APIConfig == nil {
		return nil, errors.New("该智能体未配置 API。请先在 'API 配置' 页面创建 API 配置，然后在智能体设置中选择该配置")
	}

	// 使用智能体关联的 API 配置
	apiConfig = agent.APIConfig
	endpointURL = apiConfig.EndpointURL
	apiKey = apiConfig.Credentials

	// 验证用户配置的 API Key
	if apiKey == "" {
		return nil, errors.New("API 配置中未设置 API 密钥。请在 'API 配置' 页面编辑该配置并填写 API 密钥")
	}

	// 构建消息列表
	var chatMessages []map[string]interface{}

	// 添加系统提示词
	if agent.SystemPrompt != "" {
		chatMessages = append(chatMessages, map[string]interface{}{
			"role":    "system",
			"content": agent.SystemPrompt,
		})
	}

	// 添加历史消息
	for _, msg := range messages {
		chatMessages = append(chatMessages, map[string]interface{}{
			"role":    string(msg.Role),
			"content": msg.Content,
		})
	}

	// 构建请求体
	requestBody := map[string]interface{}{
		"model":    agent.ModelName,
		"messages": chatMessages,
		"stream":   stream,
	}

	// 添加模型参数
	if agent.ModelParams.Temperature > 0 {
		requestBody["temperature"] = agent.ModelParams.Temperature
	}
	if agent.ModelParams.MaxTokens > 0 {
		requestBody["max_tokens"] = agent.ModelParams.MaxTokens
	}
	if agent.ModelParams.TopP > 0 {
		requestBody["top_p"] = agent.ModelParams.TopP
	}
	if agent.ModelParams.FrequencyPenalty != 0 {
		requestBody["frequency_penalty"] = agent.ModelParams.FrequencyPenalty
	}
	if agent.ModelParams.PresencePenalty != 0 {
		requestBody["presence_penalty"] = agent.ModelParams.PresencePenalty
	}

	// 应用字段映射（如果有自定义配置）
	if apiConfig != nil && apiConfig.FieldMapping.RequestMapping != nil {
		requestBody = s.applyFieldMapping(requestBody, apiConfig.FieldMapping.RequestMapping)
	}

	// 序列化请求体
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	// 创建HTTP请求
	req, err := http.NewRequest("POST", endpointURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/json")

	if apiConfig != nil {
		switch apiConfig.AuthType {
		case models.AuthBearer:
			req.Header.Set("Authorization", "Bearer "+apiKey)
		case models.AuthAPIKey:
			req.Header.Set("X-API-Key", apiKey)
		}
	} else {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	return req, nil
}

// extractContent 从响应中提取内容
func (s *AIService) extractContent(result map[string]interface{}) (string, error) {
	choices, ok := result["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		return "", errors.New("无效的响应格式")
	}

	choice := choices[0].(map[string]interface{})
	message, ok := choice["message"].(map[string]interface{})
	if !ok {
		return "", errors.New("无效的消息格式")
	}

	content, ok := message["content"].(string)
	if !ok {
		return "", errors.New("无法提取内容")
	}

	return content, nil
}

// extractTokens 从响应中提取Token使用量
func (s *AIService) extractTokens(result map[string]interface{}) (int, int) {
	usage, ok := result["usage"].(map[string]interface{})
	if !ok {
		return 0, 0
	}

	inputTokens := 0
	outputTokens := 0

	if val, ok := usage["prompt_tokens"].(float64); ok {
		inputTokens = int(val)
	}
	if val, ok := usage["completion_tokens"].(float64); ok {
		outputTokens = int(val)
	}

	return inputTokens, outputTokens
}

// applyFieldMapping 应用字段映射
func (s *AIService) applyFieldMapping(data map[string]interface{}, mapping map[string]interface{}) map[string]interface{} {
	// 简单的字段映射实现
	// 实际使用中可能需要更复杂的映射逻辑
	result := make(map[string]interface{})

	for key, value := range data {
		if mappedKey, ok := mapping[key].(string); ok {
			result[mappedKey] = value
		} else {
			result[key] = value
		}
	}

	return result
}

// CountTokens 估算Token数量（简单实现）
func CountTokens(text string) int {
	// 简单估算：英文约4字符=1token，中文约1.5字符=1token
	// 实际应该使用tiktoken等专业库
	words := strings.Fields(text)
	chineseChars := 0

	for _, char := range text {
		if char >= 0x4e00 && char <= 0x9fa5 {
			chineseChars++
		}
	}

	return len(words) + chineseChars/2
}
