# AI Chat - 智能体对话平台

一个功能完善的AI智能体对话平台，支持多API接入、对话管理、智能体配置、Token统计等功能。

## 🌟 主要功能

### 核心功能
- ✅ **多API接入** - 优先支持OpenRouter，可自定义字段映射
- ✅ **对话持久化** - MySQL数据库存储所有对话记录
- ✅ **智能体管理** - 创建和管理多个AI智能体
- ✅ **自定义提示词** - 为每个智能体配置专属系统提示词
- ✅ **Token统计** - 详细的使用统计和成本分析
- ✅ **流式响应** - 支持实时流式对话（SSE）

### 扩展功能
- 📊 **使用分析** - 可视化图表展示Token使用趋势
- 🔐 **用户认证** - JWT Token认证系统
- 🎨 **现代化UI** - 基于React + Tailwind CSS
- 📱 **响应式设计** - 支持移动端和桌面端
- 🔄 **实时更新** - 对话列表自动更新
- 💾 **本地存储** - 对话记录永久保存

## 🏗️ 技术栈

### 后端
- **语言**: Go 1.21+
- **框架**: Gin
- **数据库**: MySQL 8.0+
- **ORM**: GORM
- **认证**: JWT
- **缓存**: Redis (可选)

### 前端
- **框架**: React 18 + TypeScript
- **路由**: React Router v6
- **样式**: Tailwind CSS
- **HTTP**: Axios
- **图表**: Recharts
- **Markdown**: React Markdown
- **图标**: Lucide React

## 📦 快速开始

### 前置要求

- Go 1.21+
- Node.js 16+
- MySQL 8.0+
- Git

### 1. 克隆项目

```bash
cd /Users/derrick/Documents/code/project/ai_chat
```

### 2. 后端设置

```bash
cd backend

# 安装依赖
go mod download

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置数据库等信息
# vim .env

# 创建数据库
mysql -u root -p
CREATE DATABASE ai_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# 运行后端服务（会自动迁移数据库）
go run main.go

# 或使用 Make
make run
```

后端服务将在 http://localhost:8080 启动

### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端服务将在 http://localhost:3000 启动

### 4. 配置API密钥

1. 访问 http://localhost:3000
2. 注册并登录账户
3. 进入"API配置"页面
4. 添加您的OpenRouter API密钥（或其他AI服务密钥）
5. 创建智能体并开始对话

## 📝 环境变量配置

### 后端 (.env)

```env
# 服务器配置
SERVER_PORT=8080
GIN_MODE=debug

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_chat

# JWT配置
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE_HOURS=24

# CORS配置
CORS_ORIGINS=http://localhost:3000

# OpenRouter配置（默认）
OPENROUTER_API_URL=https://openrouter.ai/api/v1
```

### 前端 (.env)

在 `frontend` 目录创建 `.env` 文件：

```env
REACT_APP_API_URL=http://localhost:8080/api
```

## 🎯 使用指南

### 1. 注册账户

访问注册页面创建您的账户。

### 2. 配置API

- 进入"API配置"页面
- 点击"添加配置"
- 选择API类型（推荐OpenRouter）
- 输入API密钥
- 保存配置

### 3. 创建智能体

- 进入"智能体"页面
- 点击"创建智能体"
- 填写智能体信息：
  - 名称
  - 描述
  - 系统提示词
  - 选择模型
  - 调整参数（Temperature、Max Tokens等）
- 保存智能体

### 4. 开始对话

- 进入"对话"页面
- 点击"新建对话"
- 选择智能体
- 开始聊天！

## 📊 API文档

### 认证相关

```
POST /api/auth/register  - 用户注册
POST /api/auth/login     - 用户登录
GET  /api/auth/profile   - 获取用户信息
PUT  /api/auth/profile   - 更新用户信息
```

### 智能体管理

```
GET    /api/agents     - 获取智能体列表
POST   /api/agents     - 创建智能体
GET    /api/agents/:id - 获取智能体详情
PUT    /api/agents/:id - 更新智能体
DELETE /api/agents/:id - 删除智能体
```

### 对话管理

```
GET    /api/conversations           - 获取对话列表
POST   /api/conversations           - 创建对话
GET    /api/conversations/:id       - 获取对话详情
PUT    /api/conversations/:id       - 更新对话
DELETE /api/conversations/:id       - 删除对话
GET    /api/conversations/:id/messages - 获取消息列表
POST   /api/conversations/:id/messages - 发送消息
POST   /api/conversations/:id/stream   - 流式对话
```

### API配置

```
GET    /api/configs     - 获取API配置列表
POST   /api/configs     - 创建API配置
GET    /api/configs/:id - 获取API配置详情
PUT    /api/configs/:id - 更新API配置
DELETE /api/configs/:id - 删除API配置
```

### 使用统计

```
GET /api/usage/stats    - 获取总体统计
GET /api/usage/daily    - 获取每日统计
GET /api/usage/by-agent - 按智能体统计
```

## 🔧 开发命令

### 后端

```bash
# 运行开发服务器
make run

# 编译项目
make build

# 运行测试
make test

# 清理编译文件
make clean

# 安装依赖
make deps
```

### 前端

```bash
# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 运行测试
npm test

# 代码检查
npm run lint
```

## 📁 项目结构

```
ai_chat/
├── backend/                 # 后端代码
│   ├── config/             # 配置
│   ├── controllers/        # 控制器
│   ├── database/           # 数据库
│   ├── middleware/         # 中间件
│   ├── models/             # 数据模型
│   ├── services/           # 业务逻辑
│   ├── utils/              # 工具函数
│   ├── main.go             # 入口文件
│   ├── go.mod              # Go依赖
│   └── .env.example        # 环境变量示例
├── frontend/               # 前端代码
│   ├── public/             # 静态资源
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── types/          # TypeScript类型
│   │   ├── utils/          # 工具函数
│   │   ├── App.tsx         # 主应用
│   │   └── index.tsx       # 入口文件
│   ├── package.json        # 依赖配置
│   └── tailwind.config.js  # Tailwind配置
├── 需求文档.md              # 详细需求文档
└── README.md               # 项目说明
```

## 🚀 部署

### 使用Docker（推荐）

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 手动部署

#### 后端

```bash
cd backend
go build -o ai-chat-backend main.go
./ai-chat-backend
```

#### 前端

```bash
cd frontend
npm run build
# 将 build 目录部署到 Nginx 或其他静态服务器
```

## 🔒 安全建议

1. **生产环境务必修改JWT密钥**
2. **使用HTTPS**
3. **定期备份数据库**
4. **不要在代码中硬编码API密钥**
5. **启用数据库访问控制**
6. **配置防火墙规则**

## 🐛 常见问题

### 1. 数据库连接失败

检查MySQL服务是否启动，以及 `.env` 中的数据库配置是否正确。

### 2. CORS错误

确保后端 `.env` 中的 `CORS_ORIGINS` 包含前端地址。

### 3. API调用失败

检查API配置是否正确，密钥是否有效。

### 4. 前端无法连接后端

确保后端服务正在运行，并检查前端 `.env` 中的 `REACT_APP_API_URL` 配置。

## 📄 许可证

MIT License

## 👥 贡献

欢迎提交Issue和Pull Request！

## 📧 联系方式

如有问题，请提交Issue或联系开发者。

## 🎉 致谢

- [OpenRouter](https://openrouter.ai/) - 提供统一的AI模型接口
- [Gin](https://gin-gonic.com/) - 高性能Go Web框架
- [React](https://react.dev/) - 用户界面库
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

---

**Happy Coding! 🚀**

# ai_chat
