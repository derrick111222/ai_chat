# AI Chat 安装指南

## 快速开始（推荐）

### 1. 安装MySQL

```bash
# macOS
brew install mysql
brew services start mysql

# 创建数据库
mysql -u root -p
CREATE DATABASE ai_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

### 2. 配置后端

```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env` 文件，修改以下配置：

```env
DB_PASSWORD=your_mysql_password
JWT_SECRET=your-random-secret-key-here
```

### 3. 配置前端

```bash
cd frontend
echo "REACT_APP_API_URL=http://localhost:8080/api" > .env
```

### 4. 启动应用

```bash
# 方式1: 使用启动脚本（推荐）
./start.sh

# 方式2: 手动启动

# 终端1 - 启动后端
cd backend
go run main.go

# 终端2 - 启动前端
cd frontend
npm install
npm start
```

### 5. 访问应用

打开浏览器访问: http://localhost:3000

## 首次使用

### 1. 注册账户

- 访问 http://localhost:3000/register
- 填写用户名、邮箱和密码
- 点击注册

### 2. 配置API

- 登录后进入"API配置"页面
- 点击"添加配置"
- 选择API类型（推荐OpenRouter）
- 输入您的API密钥
  - OpenRouter: https://openrouter.ai/keys
  - OpenAI: https://platform.openai.com/api-keys
  - 其他服务商的API密钥
- 保存配置

### 3. 创建智能体

- 进入"智能体"页面
- 点击"创建智能体"
- 填写信息：
  - **名称**: 例如"编程助手"
  - **描述**: 描述智能体的功能
  - **系统提示词**: 定义智能体的角色和行为
    ```
    你是一个专业的编程助手，擅长帮助用户解决编程问题。
    你应该提供清晰、准确的代码示例和解释。
    ```
  - **API配置**: 选择刚才创建的API配置
  - **模型**: 选择一个模型（推荐 anthropic/claude-3.5-sonnet）
  - **Temperature**: 0.7（创造性程度）
  - **Max Tokens**: 2000（最大回复长度）
- 点击"创建"

### 4. 开始对话

- 进入"对话"页面
- 点击"新建对话"
- 选择刚才创建的智能体
- 开始聊天！

## 推荐的智能体配置

### 1. 编程助手

```
名称: 编程助手
系统提示词:
你是一个专业的编程助手，精通多种编程语言和框架。
你应该：
1. 提供清晰、可运行的代码示例
2. 解释代码的工作原理
3. 指出潜在的问题和最佳实践
4. 使用中文回答

模型: anthropic/claude-3.5-sonnet
Temperature: 0.3
Max Tokens: 4000
```

### 2. 写作助手

```
名称: 写作助手
系统提示词:
你是一个专业的写作助手，擅长各类文案创作。
你应该：
1. 根据用户需求创作高质量内容
2. 注意语言的流畅性和准确性
3. 提供多个版本供选择
4. 可以润色和改进用户的文本

模型: openai/gpt-4-turbo
Temperature: 0.8
Max Tokens: 2000
```

### 3. 翻译专家

```
名称: 翻译专家
系统提示词:
你是一个专业的翻译专家，精通中英文翻译。
你应该：
1. 准确翻译文本内容
2. 保持原文的语气和风格
3. 解释难以翻译的词汇或表达
4. 提供更自然的表达方式

模型: google/gemini-pro
Temperature: 0.2
Max Tokens: 2000
```

## 常用模型推荐

### OpenRouter支持的热门模型

1. **anthropic/claude-3.5-sonnet** - 最强大的Claude模型，适合复杂任务
2. **anthropic/claude-3-opus** - Claude最大模型，超强理解能力
3. **openai/gpt-4-turbo** - OpenAI最新GPT-4，性价比高
4. **openai/gpt-4** - 经典GPT-4，稳定可靠
5. **google/gemini-pro** - Google的强大模型
6. **meta-llama/llama-3-70b** - 开源大模型

### 如何选择模型

- **复杂任务**: Claude 3.5 Sonnet, GPT-4 Turbo
- **日常对话**: GPT-3.5 Turbo, Gemini Pro
- **编程任务**: Claude 3.5 Sonnet, GPT-4
- **创意写作**: GPT-4 Turbo, Claude 3 Opus
- **成本优先**: GPT-3.5 Turbo, Llama 3

## 获取API密钥

### OpenRouter (推荐)

1. 访问 https://openrouter.ai/
2. 注册账户
3. 进入 https://openrouter.ai/keys
4. 创建API密钥
5. 充值（支持信用卡）

**优势**:
- 支持300+模型
- 统一接口
- 按需付费
- 自动故障转移

### OpenAI

1. 访问 https://platform.openai.com/
2. 注册账户
3. 进入 https://platform.openai.com/api-keys
4. 创建API密钥

### Anthropic Claude

1. 访问 https://console.anthropic.com/
2. 注册账户
3. 创建API密钥

## 故障排查

### 后端无法启动

1. 检查MySQL是否运行
   ```bash
   mysql -u root -p
   ```

2. 检查端口8080是否被占用
   ```bash
   lsof -i :8080
   ```

3. 查看后端日志
   ```bash
   tail -f backend.log
   ```

### 前端无法连接后端

1. 确认后端正在运行
   ```bash
   curl http://localhost:8080/health
   ```

2. 检查前端 .env 配置
   ```bash
   cat frontend/.env
   ```

### API调用失败

1. 检查API密钥是否正确
2. 确认账户有足够余额
3. 查看后端日志中的错误信息

### 数据库连接失败

1. 确认MySQL服务运行中
2. 检查 backend/.env 中的数据库配置
3. 确认数据库已创建
   ```bash
   mysql -u root -p -e "SHOW DATABASES;"
   ```

## 进阶配置

### 使用Redis缓存

```bash
# 安装Redis
brew install redis
brew services start redis

# 在 backend/.env 中配置
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 配置HTTPS

使用Nginx反向代理：

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api {
        proxy_pass http://localhost:8080;
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### 生产环境部署

1. 构建前端
   ```bash
   cd frontend
   npm run build
   ```

2. 编译后端
   ```bash
   cd backend
   go build -o ai-chat-backend main.go
   ```

3. 使用进程管理器（如PM2、systemd）

## 更多帮助

- 查看详细文档: README.md
- 查看需求文档: 需求文档.md
- 提交Issue: GitHub Issues

