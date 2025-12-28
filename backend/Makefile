.PHONY: help run build test clean migrate

help: ## 显示帮助信息
	@echo "可用命令:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

run: ## 运行开发服务器
	go run main.go

build: ## 编译项目
	go build -o bin/ai-chat-backend main.go

test: ## 运行测试
	go test -v ./...

clean: ## 清理编译文件
	rm -rf bin/

deps: ## 安装依赖
	go mod download
	go mod tidy

migrate: ## 运行数据库迁移
	@echo "数据库迁移将在启动时自动执行"

dev: ## 开发模式（热重载）
	@which air > /dev/null || go install github.com/cosmtrek/air@latest
	air

