# 🚀 Eino AI Agent 平台

一个功能完整的 AI Agent 管理平台，基于 CloudWeGo Eino 框架构建。

## ✨ 核心特性

### 🤖 多种 Agent 创建方式
- **简单创建** - 快速配置基础 Agent
- **模板创建** - 从 5 个预设模板选择
- **工作流创建** - 可视化拖拽构建复杂流程

### 📦 5 个内置模板
- 💬 简单对话助手
- 💻 编程助手
- 📝 文档写作助手
- 📊 数据分析助手
- 🌐 翻译助手

### 🎨 可视化工作流编辑器
- 拖拽式节点编辑
- 4 种节点类型（ChatModel、Tool、Lambda、Retriever）
- 实时工作流验证
- 导入/导出功能
- 一键创建 Agent

### 💬 完整的对话功能
- 实时对话
- 流式响应
- 对话历史
- Token 统计

## 🏗️ 技术架构

### 后端
- **语言**: Go 1.21+
- **框架**: Gin
- **AI框架**: CloudWeGo Eino v0.7.15
- **数据库**: MySQL 8.0
- **ORM**: GORM

### 前端
- **框架**: React 18
- **语言**: TypeScript
- **UI**: Tailwind CSS
- **工作流**: React Flow
- **路由**: React Router

## 📦 快速开始

### 前置要求
- Go 1.21+
- Node.js 16+
- MySQL 8.0+
- Docker (可选)

### 1. 克隆项目
```bash
git clone <your-repo>
cd ai_chat
```

### 2. 数据库设置
```bash
# 创建数据库
mysql -u root -p < backend/database.sql

# 运行迁移
mysql -u ai_chat_user -p ai_chat < backend/migrations/001_add_workflow_fields.sql
```

### 3. 启动后端
```bash
cd backend
go mod tidy
go build -o ai-chat-backend
./ai-chat-backend
```

### 4. 启动前端
```bash
cd frontend
npm install
npm start
```

### 5. 访问应用
打开浏览器访问: `http://localhost:3000`

## 📖 使用指南

### 创建你的第一个 Agent

#### 方式一：简单创建
1. 登录系统
2. 进入"智能体管理"
3. 点击"创建智能体"
4. 填写信息并选择 API 配置
5. 开始对话

#### 方式二：从模板创建
1. 进入"模板市场"
2. 选择合适的模板
3. 配置参数
4. 创建 Agent

#### 方式三：工作流创建
1. 进入"工作流编辑器"
2. 拖拽节点到画布
3. 连接节点
4. 配置每个节点
5. 点击"创建 Agent"

## 📚 文档

### 完整指南
1. [快速启动指南](./EINO_快速启动指南.md)
2. [第一步：基础架构](./backend/EINO_INTEGRATION_STEP1.md)
3. [第二步：模板系统](./EINO_第二步完成指南.md)
4. [第三步：工作流编辑器](./EINO_第三步完成指南.md)
5. [完整功能总结](./EINO_完整功能总结.md)

### API 文档
查看 [backend/README.md](./backend/README.md)

## 🎯 功能清单

### Agent 管理
- [x] 创建/编辑/删除 Agent
- [x] 4 种工作流类型支持
- [x] Agent 列表和详情
- [x] 公开/私有设置

### 模板系统
- [x] 5 个内置模板
- [x] 模板分类筛选
- [x] 参数配置系统
- [x] 一键创建

### 工作流编辑器
- [x] 可视化画布
- [x] 4 种节点类型
- [x] 拖拽添加节点
- [x] 节点配置
- [x] 工作流验证
- [x] 导入/导出
- [x] 创建 Agent

### 对话功能
- [x] 实时对话
- [x] 流式响应
- [x] 对话历史
- [x] Token 统计

## 🔧 配置

### 后端配置
编辑 `backend/.env`:
```env
SERVER_PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=ai_chat_user
DB_PASSWORD=ai_chat_pass123
DB_NAME=ai_chat
JWT_SECRET=your-secret-key
```

### 前端配置
编辑 `frontend/src/config.ts`:
```typescript
export const config = {
  apiBaseUrl: 'http://localhost:8080/api',
  tokenKey: 'ai_chat_token',
  userKey: 'ai_chat_user',
};
```

## 🧪 测试

### 后端测试
```bash
cd backend
./test_eino_integration.sh        # 第一步测试
./test_template_integration.sh    # 第二步测试
./test_workflow_editor.sh          # 第三步测试
```

### 前端测试
```bash
cd frontend
npm test
```

## 📊 项目结构

```
ai_chat/
├── backend/              # Go 后端
│   ├── controllers/      # 控制器
│   ├── services/         # 服务层
│   ├── models/           # 数据模型
│   ├── middleware/       # 中间件
│   └── migrations/       # 数据库迁移
├── frontend/             # React 前端
│   └── src/
│       ├── pages/        # 页面组件
│       ├── components/   # 通用组件
│       └── services/     # API 服务
└── docs/                 # 文档
```

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 许可证

MIT License

## 🙏 致谢

- [CloudWeGo Eino](https://github.com/cloudwego/eino) - AI 应用开发框架
- [React Flow](https://reactflow.dev/) - 工作流可视化
- [Gin](https://gin-gonic.com/) - Go Web 框架

## 📞 联系方式

- Issues: [GitHub Issues](your-repo/issues)
- Email: your-email@example.com

---

**开始构建你的 AI 应用吧！** 🚀

