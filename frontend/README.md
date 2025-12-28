# AI Chat Frontend

基于 React + TypeScript + Tailwind CSS 的AI智能体对话前端应用

## 功能特性

- 🎨 现代化UI设计
- 📱 响应式布局
- 💬 实时对话
- 🤖 智能体管理
- 📊 使用统计可视化
- 🔐 用户认证

## 技术栈

- React 18
- TypeScript
- React Router v6
- Tailwind CSS
- Axios
- Recharts
- React Markdown
- Lucide React

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置后端API地址。

### 启动开发服务器

```bash
npm start
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
├── pages/          # 页面组件
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Chat.tsx
│   ├── Agents.tsx
│   ├── APIConfigs.tsx
│   └── Usage.tsx
├── services/       # API服务
│   ├── authService.ts
│   ├── agentService.ts
│   ├── conversationService.ts
│   ├── apiConfigService.ts
│   └── usageService.ts
├── types/          # TypeScript类型定义
│   └── index.ts
├── utils/          # 工具函数
│   ├── api.ts
│   └── auth.ts
├── App.tsx         # 主应用组件
├── index.tsx       # 入口文件
└── index.css       # 全局样式
```

## 可用脚本

- `npm start` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm test` - 运行测试
- `npm run eject` - 弹出配置（不可逆）

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)
