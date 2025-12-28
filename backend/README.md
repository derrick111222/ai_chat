# AI Chat Backend

基于 Golang + Gin + GORM + MySQL 的 AI 智能体后端服务

## 快速开始

### 1. 安装依赖

```bash
go mod download
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的配置
```

### 3. 创建数据库

```bash
mysql -u root -p
CREATE DATABASE ai_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 运行项目

```bash
go run main.go
```

服务将在 http://localhost:8080 启动

## 项目结构

```
backend/
├── main.go                 # 入口文件
├── config/                 # 配置
│   └── config.go
├── models/                 # 数据模型
│   ├── user.go
│   ├── agent.go
│   ├── conversation.go
│   ├── message.go
│   ├── api_config.go
│   └── token_usage.go
├── controllers/            # 控制器
│   ├── auth.go
│   ├── agent.go
│   ├── conversation.go
│   ├── message.go
│   ├── api_config.go
│   └── usage.go
├── middleware/             # 中间件
│   ├── auth.go
│   ├── cors.go
│   └── error.go
├── services/               # 业务逻辑
│   ├── auth.go
│   ├── agent.go
│   ├── conversation.go
│   ├── openrouter.go
│   └── token_counter.go
├── utils/                  # 工具函数
│   ├── jwt.go
│   ├── password.go
│   └── response.go
└── database/               # 数据库
    └── db.go
```

## API 文档

### 认证相关
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- GET /api/auth/profile - 获取用户信息

### 智能体管理
- GET /api/agents - 获取智能体列表
- POST /api/agents - 创建智能体
- GET /api/agents/:id - 获取智能体详情
- PUT /api/agents/:id - 更新智能体
- DELETE /api/agents/:id - 删除智能体

### 对话管理
- GET /api/conversations - 获取对话列表
- POST /api/conversations - 创建对话
- GET /api/conversations/:id - 获取对话详情
- DELETE /api/conversations/:id - 删除对话
- GET /api/conversations/:id/messages - 获取消息列表

### 消息处理
- POST /api/conversations/:id/messages - 发送消息
- POST /api/conversations/:id/stream - 流式对话（SSE）
- DELETE /api/messages/:id - 删除消息

### API配置
- GET /api/configs - 获取API配置列表
- POST /api/configs - 创建API配置
- PUT /api/configs/:id - 更新API配置
- DELETE /api/configs/:id - 删除API配置

### 统计分析
- GET /api/usage/stats - 获取使用统计
- GET /api/usage/daily - 获取每日统计

