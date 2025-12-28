# 使用 Docker 启动 MySQL

## 🚀 快速启动

### 方式一：只启动 MySQL（推荐开发环境）

```bash
# 进入项目目录
cd /Users/derrick/Documents/code/project/ai_chat

# 启动 MySQL 和 Redis
docker-compose -f docker-compose.dev.yml up -d

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f mysql

# 等待 MySQL 启动完成（看到 "ready for connections"）
```

### 方式二：使用单独的 Docker 命令

```bash
# 创建网络
docker network create ai_chat_network

# 启动 MySQL
docker run -d \
  --name ai_chat_mysql \
  --network ai_chat_network \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root123456 \
  -e MYSQL_DATABASE=ai_chat \
  -e MYSQL_USER=ai_chat_user \
  -e MYSQL_PASSWORD=ai_chat_pass123 \
  -v $(pwd)/backend/database.sql:/docker-entrypoint-initdb.d/init.sql \
  -v mysql_data:/var/lib/mysql \
  mysql:8.0 \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci
```

---

## 📋 配置说明

### MySQL 连接信息

| 配置项 | 值 |
|--------|-----|
| 主机 | localhost (或 mysql 在容器内) |
| 端口 | 3306 |
| 数据库 | ai_chat |
| 用户名 | ai_chat_user |
| 密码 | ai_chat_pass123 |
| Root密码 | root123456 |

### 后端配置文件

已为你创建了两个配置文件：

1. **`.env.local`** - 本地开发（后端在本机，MySQL在Docker）
2. **`.env.docker`** - 完全Docker化（后端也在Docker）

使用方法：
```bash
cd backend

# 本地开发模式（推荐）
cp .env.local .env

# 或完全Docker模式
cp .env.docker .env
```

---

## ✅ 验证 MySQL 启动

### 1. 检查容器状态

```bash
docker ps | grep mysql
```

应该看到：
```
ai_chat_mysql   mysql:8.0   Up 2 minutes   0.0.0.0:3306->3306/tcp
```

### 2. 检查健康状态

```bash
docker-compose -f docker-compose.dev.yml ps
```

应该看到 `healthy` 状态

### 3. 连接测试

```bash
# 使用 Docker 内的 MySQL 客户端
docker exec -it ai_chat_mysql mysql -u ai_chat_user -pai_chat_pass123 ai_chat

# 或使用本地 MySQL 客户端
mysql -h 127.0.0.1 -P 3306 -u ai_chat_user -pai_chat_pass123 ai_chat
```

### 4. 查看数据库

```sql
-- 查看所有数据库
SHOW DATABASES;

-- 使用 ai_chat 数据库
USE ai_chat;

-- 查看所有表
SHOW TABLES;

-- 应该看到以下表：
-- users
-- api_configs
-- agents
-- conversations
-- messages
-- token_usages
-- prompt_templates

-- 退出
EXIT;
```

---

## 🔧 常用命令

### 启动和停止

```bash
# 启动
docker-compose -f docker-compose.dev.yml up -d

# 停止
docker-compose -f docker-compose.dev.yml stop

# 停止并删除容器（保留数据）
docker-compose -f docker-compose.dev.yml down

# 停止并删除容器和数据（危险！）
docker-compose -f docker-compose.dev.yml down -v
```

### 查看日志

```bash
# 查看 MySQL 日志
docker-compose -f docker-compose.dev.yml logs -f mysql

# 查看最近100行
docker-compose -f docker-compose.dev.yml logs --tail=100 mysql

# 查看所有服务日志
docker-compose -f docker-compose.dev.yml logs -f
```

### 进入容器

```bash
# 进入 MySQL 容器
docker exec -it ai_chat_mysql bash

# 在容器内连接 MySQL
mysql -u root -proot123456

# 退出容器
exit
```

### 备份和恢复

```bash
# 备份数据库
docker exec ai_chat_mysql mysqldump -u root -proot123456 ai_chat > backup.sql

# 恢复数据库
docker exec -i ai_chat_mysql mysql -u root -proot123456 ai_chat < backup.sql
```

---

## 📝 完整启动流程

### 步骤 1: 启动 MySQL

```bash
cd /Users/derrick/Documents/code/project/ai_chat

# 启动 MySQL 和 Redis
docker-compose -f docker-compose.dev.yml up -d

# 等待启动完成（约10-30秒）
docker-compose -f docker-compose.dev.yml logs -f mysql
# 看到 "ready for connections" 后按 Ctrl+C 退出日志
```

### 步骤 2: 验证数据库

```bash
# 连接数据库
mysql -h 127.0.0.1 -P 3306 -u ai_chat_user -pai_chat_pass123 ai_chat

# 查看表
SHOW TABLES;

# 退出
EXIT;
```

### 步骤 3: 配置后端

```bash
cd backend

# 复制配置文件
cp .env.local .env

# 安装依赖
go mod download
```

### 步骤 4: 启动后端

```bash
# 在 backend 目录
go run main.go
```

看到 "Server is running on http://localhost:8080" 表示成功

### 步骤 5: 启动前端

```bash
# 新开一个终端
cd /Users/derrick/Documents/code/project/ai_chat/frontend

# 配置环境变量
echo "REACT_APP_API_URL=http://localhost:8080/api" > .env

# 安装依赖（如果还没安装）
npm install

# 启动
npm start
```

浏览器自动打开 http://localhost:3000

---

## 🐛 故障排查

### 问题1: 端口3306被占用

```bash
# 查看占用端口的进程
lsof -i :3306

# 停止本地MySQL
brew services stop mysql  # macOS
sudo systemctl stop mysql  # Linux

# 或修改 docker-compose.dev.yml 中的端口映射
# 将 "3306:3306" 改为 "3307:3306"
# 然后在 .env 中设置 DB_PORT=3307
```

### 问题2: 容器启动失败

```bash
# 查看详细日志
docker-compose -f docker-compose.dev.yml logs mysql

# 删除容器重新创建
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### 问题3: 数据库初始化失败

```bash
# 手动执行初始化脚本
docker exec -i ai_chat_mysql mysql -u root -proot123456 ai_chat < backend/database.sql

# 或进入容器手动执行
docker exec -it ai_chat_mysql bash
mysql -u root -proot123456 ai_chat < /docker-entrypoint-initdb.d/init.sql
```

### 问题4: 无法连接数据库

```bash
# 检查容器是否运行
docker ps | grep mysql

# 检查网络连接
docker exec ai_chat_mysql mysqladmin ping -h localhost -u root -proot123456

# 测试从宿主机连接
telnet localhost 3306
```

---

## 🔐 安全建议

### 生产环境

1. **修改默认密码**
```yaml
environment:
  MYSQL_ROOT_PASSWORD: 使用强密码
  MYSQL_PASSWORD: 使用强密码
```

2. **限制网络访问**
```yaml
ports:
  - "127.0.0.1:3306:3306"  # 只允许本地访问
```

3. **使用 secrets**
```yaml
secrets:
  mysql_root_password:
    file: ./secrets/mysql_root_password.txt
```

---

## 📊 性能优化

### 调整 MySQL 配置

编辑 `mysql/my.cnf`:

```ini
[mysqld]
# 根据服务器内存调整
innodb_buffer_pool_size=512M  # 建议设置为物理内存的50-70%
max_connections=500
innodb_log_file_size=128M
```

重启容器使配置生效：
```bash
docker-compose -f docker-compose.dev.yml restart mysql
```

---

## 🎯 快速命令总结

```bash
# 启动 MySQL
docker-compose -f docker-compose.dev.yml up -d

# 查看状态
docker-compose -f docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f mysql

# 连接数据库
mysql -h 127.0.0.1 -P 3306 -u ai_chat_user -pai_chat_pass123 ai_chat

# 停止 MySQL
docker-compose -f docker-compose.dev.yml stop

# 删除容器（保留数据）
docker-compose -f docker-compose.dev.yml down

# 删除容器和数据
docker-compose -f docker-compose.dev.yml down -v
```

---

**现在你可以使用 Docker 轻松管理 MySQL 了！** 🎉

