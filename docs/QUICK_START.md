# EduGenius AI 快速开始

本指南将帮助您在 5 分钟内部署 EduGenius AI。

---

## 🚀 方式1：一键部署（推荐）

### 前置要求

- Docker 20.10+
- Docker Compose 1.29+

### 快速启动

```bash
# 1. 克隆仓库
git clone https://github.com/wuyifan-code/EduGenius-AI-.git
cd EduGenius-AI-

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入您的配置

# 3. 一键部署
chmod +x scripts/deploy.sh
./scripts/deploy.sh start
```

### 访问服务

- Web界面: http://localhost:8000
- API文档: http://localhost:8000/docs

### 常用命令

```bash
# 查看服务状态
./scripts/deploy.sh status

# 查看日志
./scripts/deploy.sh logs

# 停止服务
./scripts/deploy.sh stop

# 重启服务
./scripts/deploy.sh restart

# 备份数据
./scripts/deploy.sh backup
```

---

## 🐳 方式2：Docker Compose 部署

### 1. 配置环境变量

```bash
cp .env.example .env
vi .env
```

### 2. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 初始化数据库
docker-compose exec app python scripts/init_db.py
```

### 3. 停止服务

```bash
docker-compose down

# 完全清理（包括数据）
docker-compose down -v
```

---

## 💻 方式3：本地开发部署

### 1. 安装依赖

```bash
# Python 3.9+
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 2. 配置数据库

```bash
# 使用 Docker 启动 PostgreSQL
docker run -d --name edugenius-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=edugenius \
  -p 5432:5432 \
  postgres:14-alpine

# 等待数据库启动
sleep 5

# 初始化数据库
python scripts/init_db.py
```

### 3. 配置环境变量

```bash
cp .env.example .env
vi .env
```

### 4. 启动服务

```bash
# 启动 HTTP 服务
python src/main.py -m http -p 8000

# 或使用脚本
bash scripts/http_run.sh -p 8000
```

---

## 📋 配置说明

### 必填配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接地址 | `postgresql://postgres:postgres@localhost:5432/edugenius` |
| `S3_ENDPOINT` | 对象存储端点 | `https://s3.amazonaws.com` |
| `S3_ACCESS_KEY` | 对象存储访问密钥 | `AKIAIOSFODNN7EXAMPLE` |
| `S3_SECRET_KEY` | 对象存储密钥 | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_BUCKET` | 对象存储桶名 | `edugenius-bucket` |

### 可选配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `ALIYUN_ACCESS_KEY` | 阿里云访问密钥 | - |
| `ALIYUN_ACCESS_KEY_SECRET` | 阿里云密钥 | - |
| `ALIYUN_APP_KEY` | 阿里云应用密钥 | - |
| `COZE_INTEGRATION_MODEL_BASE_URL` | 大模型端点 | - |
| `LOG_LEVEL` | 日志级别 | `INFO` |
| `PORT` | 服务端口 | `8000` |

---

## 🧪 测试服务

### 健康检查

```bash
curl http://localhost:8000/health
```

### 测试API

```bash
# 发送消息
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'
```

### 测试语音对话

```bash
# 测试实时语音对话
python -c "
from src.tools.realtime_voice_tool import realtime_voice_conversation
result = realtime_voice_conversation('你好')
print(result)
"
```

---

## 🔧 故障排查

### 1. 端口被占用

```bash
# 查找占用端口的进程
lsof -i :8000

# 修改 .env 中的端口配置
PORT=9000
```

### 2. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres
```

### 3. 内存不足

```bash
# 减少容器资源限制
# 编辑 docker-compose.yml，添加限制
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
```

### 4. 查看详细日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f app

# 查看应用日志
tail -f logs/app.log
```

---

## 📚 下一步

- [阅读完整部署指南](./DEPLOYMENT.md)
- [查看API文档](./docs/API.md)
- [配置监控和告警](./docs/MONITORING.md)
- [性能优化建议](./docs/OPTIMIZATION.md)

---

## 💬 获取帮助

- 提交 Issue: https://github.com/wuyifan-code/EduGenius-AI-/issues
- 查看文档: https://github.com/wuyifan-code/EduGenius-AI-/docs
- 联系支持: support@edugenius.ai

---

## ⭐ Star 支持

如果这个项目对您有帮助，请给我们一个 Star ⭐

https://github.com/wuyifan-code/EduGenius-AI-
