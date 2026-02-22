# EduGenius AI 部署指南

本文档提供 EduGenius AI 的多种部署方案。

---

## 📋 目录

- [环境要求](#环境要求)
- [本地部署](#本地部署)
- [服务器部署](#服务器部署)
- [Docker 部署](#docker-部署)
- [云平台部署](#云平台部署)
- [常见问题](#常见问题)

---

## 环境要求

### 硬件要求

| 环境 | CPU | 内存 | 硬盘 |
|------|-----|------|------|
| 最小配置 | 2核 | 4GB | 20GB |
| 推荐配置 | 4核 | 8GB | 50GB |
| 生产配置 | 8核+ | 16GB+ | 100GB+ |

### 软件要求

- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / macOS / Windows (WSL2)
- **Python**: 3.9+
- **PostgreSQL**: 12+
- **Nginx**: 1.18+ (生产环境推荐)
- **Docker**: 20.10+ (可选)

---

## 本地部署

适用于开发和测试环境。

### 1. 克隆仓库

```bash
git clone https://github.com/wuyifan-code/EduGenius-AI-.git
cd EduGenius-AI-
```

### 2. 安装依赖

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置
DATABASE_URL=postgresql://postgres:password@localhost:5432/edugenius

# 对象存储配置
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=edugenius-bucket

# 语音服务配置（可选）
ALIYUN_ACCESS_KEY=your-aliyun-access-key
ALIYUN_ACCESS_KEY_SECRET=your-aliyun-secret
ALIYUN_APP_KEY=your-aliyun-app-key

# 大模型配置
COZE_INTEGRATION_MODEL_BASE_URL=https://your-model-endpoint.com
```

### 4. 初始化数据库

```bash
# 启动 PostgreSQL
docker run -d --name postgres-edugenius \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=edugenius \
  -p 5432:5432 \
  postgres:14

# 创建数据库表
python scripts/init_db.py
```

### 5. 启动服务

```bash
# 启动 HTTP 服务（默认端口 8000）
bash scripts/http_run.sh -p 8000

# 或使用 Python 直接运行
python src/main.py -m http -p 8000
```

### 6. 访问服务

打开浏览器访问：http://localhost:8000

---

## 服务器部署

适用于生产环境。

### 1. 服务器准备

购买云服务器（阿里云、腾讯云、AWS等）：
- 推荐：Ubuntu 20.04 LTS
- 配置：4核8GB起步

### 2. 安装基础环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Python 3.9+
sudo apt install python3.9 python3.9-venv python3-pip -y

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 安装 Nginx
sudo apt install nginx -y

# 安装 Supervisor（进程管理）
sudo apt install supervisor -y
```

### 3. 配置 PostgreSQL

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE edugenius;
CREATE USER edugenius WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE edugenius TO edugenius;
\q
```

### 4. 部署应用

```bash
# 创建应用目录
sudo mkdir -p /opt/edugenius
sudo chown $USER:$USER /opt/edugenius

# 克隆代码
cd /opt/edugenius
git clone https://github.com/wuyifan-code/EduGenius-AI-.git .
git config --global credential.helper store

# 创建虚拟环境
python3.9 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
pip install gunicorn

# 配置环境变量
cat > /opt/edugenius/.env << 'EOF'
DATABASE_URL=postgresql://edugenius:your_password@localhost:5432/edugenius
S3_ENDPOINT=your-s3-endpoint
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=edugenius-bucket
ALIYUN_ACCESS_KEY=your-aliyun-access-key
ALIYUN_ACCESS_KEY_SECRET=your-aliyun-secret
ALIYUN_APP_KEY=your-aliyun-app-key
COZE_INTEGRATION_MODEL_BASE_URL=your-model-endpoint
EOF

# 初始化数据库
source venv/bin/activate
python scripts/init_db.py
```

### 5. 配置 Supervisor

```bash
# 创建 supervisor 配置
sudo cat > /etc/supervisor/conf.d/edugenius.conf << 'EOF'
[program:edugenius]
command=/opt/edugenius/venv/bin/python src/main.py -m http -p 8000
directory=/opt/edugenius
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/edugenius.err.log
stdout_logfile=/var/log/edugenius.out.log
environment=PYTHONPATH="/opt/edugenius"
EOF

# 重载 supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start edugenius
```

### 6. 配置 Nginx 反向代理

```bash
# 创建 Nginx 配置
sudo cat > /etc/nginx/sites-available/edugenius << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时配置
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }

    # 静态文件
    location /static {
        alias /opt/edugenius/static;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/edugenius /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 7. 配置 HTTPS（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## Docker 部署

推荐用于快速部署和跨环境一致性。

### 1. 创建 Dockerfile

```dockerfile
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["gunicorn", "src.main:app", "--workers", "4", "--bind", "0.0.0.0:8000", "--timeout", "600", "--worker-class", "uvicorn.workers.UvicornWorker"]
```

### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: edugenius-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: edugenius
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - edugenius-network

  app:
    build: .
    container_name: edugenius-app
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/edugenius
      S3_ENDPOINT: ${S3_ENDPOINT}
      S3_ACCESS_KEY: ${S3_ACCESS_KEY}
      S3_SECRET_KEY: ${S3_SECRET_KEY}
      S3_BUCKET: ${S3_BUCKET}
      ALIYUN_ACCESS_KEY: ${ALIYUN_ACCESS_KEY}
      ALIYUN_ACCESS_KEY_SECRET: ${ALIYUN_ACCESS_KEY_SECRET}
      ALIYUN_APP_KEY: ${ALIYUN_APP_KEY}
      COZE_INTEGRATION_MODEL_BASE_URL: ${COZE_INTEGRATION_MODEL_BASE_URL}
    depends_on:
      - postgres
    volumes:
      - ./logs:/app/logs
      - ./assets:/app/assets
    networks:
      - edugenius-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: edugenius-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - edugenius-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  edugenius-network:
    driver: bridge
```

### 3. 创建 .env 文件

```env
# 对象存储
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=edugenius-bucket

# 语音服务
ALIYUN_ACCESS_KEY=your-aliyun-access-key
ALIYUN_ACCESS_KEY_SECRET=your-aliyun-secret
ALIYUN_APP_KEY=your-aliyun-app-key

# 大模型
COZE_INTEGRATION_MODEL_BASE_URL=your-model-endpoint
```

### 4. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 初始化数据库
docker-compose exec app python scripts/init_db.py

# 停止服务
docker-compose down

# 完全清理（包括数据）
docker-compose down -v
```

---

## 云平台部署

### 阿里云 ECS + RDS 部署

#### 1. 购买 ECS 实例

- 地域：选择离用户最近的区域
- 实例规格：ecs.c6.xlarge (4核8GB)
- 镜像：Ubuntu 20.04 LTS
- 存储：SSD 50GB
- 带宽：5Mbps

#### 2. 购买 RDS PostgreSQL

- 版本：PostgreSQL 14
- 规格：2核4GB
- 存储：100GB
- 白名单：添加 ECS 内网 IP

#### 3. 配置 ECS

```bash
# 连接到 ECS
ssh root@your-ecs-ip

# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 克隆代码
git clone https://github.com/wuyifan-code/EduGenius-AI-.git
cd EduGenius-AI-

# 配置环境变量
cat > .env << 'EOF'
DATABASE_URL=postgresql://your-rds-user:your-password@your-rds-endpoint:5432/edugenius
S3_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
S3_ACCESS_KEY=your-aliyun-oss-access-key
S3_SECRET_KEY=your-aliyun-oss-secret-key
S3_BUCKET=edugenius-bucket
ALIYUN_ACCESS_KEY=your-aliyun-access-key
ALIYUN_ACCESS_KEY_SECRET=your-aliyun-secret-key
ALIYUN_APP_KEY=your-aliyun-app-key
COZE_INTEGRATION_MODEL_BASE_URL=your-model-endpoint
EOF

# 启动服务
docker-compose up -d

# 初始化数据库
docker-compose exec app python scripts/init_db.py
```

#### 4. 配置负载均衡（SLB）

- 创建负载均衡实例（公网类型）
- 添加监听：HTTP 80、HTTPS 443
- 添加后端服务器：ECS 实例
- 配置健康检查

### 腾讯云部署

类似阿里云，使用腾讯云 CVM + PostgreSQL。

### AWS 部署

#### 1. 使用 EC2 + RDS

```bash
# 使用 AWS CLI 部署
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.large \
  --key-name your-key-pair \
  --security-group-ids sg-12345678

# 配置 RDS
aws rds create-db-instance \
  --db-instance-identifier edugenius-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password your-password
```

#### 2. 使用 ECS Fargate

```yaml
# task-definition.json
{
  "family": "edugenius",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "edugenius",
      "image": "your-registry/edugenius:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://..."
        }
      ]
    }
  ]
}
```

---

## 性能优化

### 1. 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_question_embeddings ON question_bank USING ivfflat (embedding vector_cosine_ops);

-- 配置连接池
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
```

### 2. 应用优化

```python
# gunicorn 配置
workers = (2 * CPU) + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 600
keepalive = 5
```

### 3. Nginx 优化

```nginx
# nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 65535;
    use epoll;
}

http {
    # 缓存配置
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

    # 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

---

## 监控和日志

### 1. 日志查看

```bash
# Supervisor 日志
tail -f /var/log/edugenius.out.log

# Docker 日志
docker-compose logs -f app

# 应用日志
tail -f /app/work/logs/bypass/app.log
```

### 2. 监控工具

- **Prometheus + Grafana**: 系统监控
- **Sentry**: 错误追踪
- **ELK Stack**: 日志分析

### 3. 健康检查

```bash
# 检查服务状态
curl http://localhost:8000/health

# 检查数据库连接
docker-compose exec postgres psql -U postgres -d edugenius -c "SELECT 1;"
```

---

## 常见问题

### 1. 端口被占用

```bash
# 查找占用端口的进程
sudo lsof -i :8000

# 杀死进程
sudo kill -9 <PID>
```

### 2. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查连接
psql -U postgres -h localhost -p 5432 -d edugenius
```

### 3. 权限问题

```bash
# 修改文件权限
sudo chown -R www-data:www-data /opt/edugenius
sudo chmod -R 755 /opt/edugenius
```

### 4. 内存不足

```bash
# 增加 swap 空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 安全建议

1. **定期更新依赖**: `pip list --outdated`
2. **使用 HTTPS**: 配置 SSL 证书
3. **限制访问**: 配置防火墙规则
4. **备份数据**: 定期备份 PostgreSQL
5. **监控日志**: 设置异常告警
6. **使用密钥管理**: 不要在代码中硬编码密钥

---

## 备份和恢复

### 备份数据库

```bash
# 备份
pg_dump -U postgres edugenius > backup_$(date +%Y%m%d).sql

# 恢复
psql -U postgres edugenius < backup_20240101.sql
```

### 备份应用数据

```bash
# 备份 assets 目录
tar -czf assets_backup_$(date +%Y%m%d).tar.gz assets/

# 恢复
tar -xzf assets_backup_20240101.tar.gz
```

---

## 联系支持

如遇到部署问题，请：
1. 查看日志文件定位问题
2. 提交 Issue: https://github.com/wuyifan-code/EduGenius-AI-/issues
3. 提供详细的环境信息和错误日志
