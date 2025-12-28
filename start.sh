#!/bin/bash

# AI Chat 启动脚本

echo "🚀 启动 AI Chat 应用..."
echo ""

# 检查是否在项目根目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "❌ 错误: 未找到 Go，请先安装 Go 1.21+"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js 16+"
    exit 1
fi

# 检查 MySQL 是否运行
if ! command -v mysql &> /dev/null; then
    echo "⚠️  警告: 未找到 MySQL，请确保 MySQL 已安装并运行"
fi

echo "✅ 环境检查通过"
echo ""

# 启动后端
echo "📦 启动后端服务..."
cd backend

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，从 .env.example 复制..."
    cp .env.example .env
    echo "⚠️  请编辑 backend/.env 文件配置数据库等信息"
fi

# 安装 Go 依赖
echo "📥 安装 Go 依赖..."
go mod download

# 后台启动后端
echo "🔧 启动后端服务 (http://localhost:8080)..."
nohup go run main.go > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo ""

cd ..

# 启动前端
echo "📦 启动前端服务..."
cd frontend

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📥 安装前端依赖..."
    npm install
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "REACT_APP_API_URL=http://localhost:8080/api" > .env
fi

# 启动前端
echo "🔧 启动前端服务 (http://localhost:3000)..."
npm start

cd ..

