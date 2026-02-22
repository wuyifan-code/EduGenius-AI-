# 数据库连接问题解决方案

## 🔍 问题诊断

您遇到的错误：`terminating connection due to administrator command`

这是 PostgreSQL 连接错误，表示数据库连接被服务器主动关闭。

---

## 📋 可能的原因

1. **PostgreSQL 服务未启动** - 最常见的原因
2. **连接数超限** - 数据库最大连接数限制
3. **管理员终止连接** - 数据库管理员手动终止
4. **数据库重启** - 服务重启导致所有连接断开
5. **网络问题** - 网络不稳定导致连接中断
6. **超时设置** - 连接超时配置过短

---

## 🛠️ 解决方案

### 方案 1：使用 Docker 快速启动 PostgreSQL（推荐）

如果您有 Docker 环境，这是最简单的方法：

```bash
# 启动 PostgreSQL 容器
docker run -d --name edugenius-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=edugenius \
  -p 5432:5432 \
  postgres:14-alpine

# 查看容器状态
docker ps | grep edugenius-postgres

# 查看日志
docker logs edugenius-postgres

# 测试连接
docker exec -it edugenius-postgres psql -U postgres -c "\l"
```

**优点**：
- 独立运行，不依赖系统服务
- 环境隔离，避免冲突
- 快速启动和停止

---

### 方案 2：使用 Docker Compose（推荐用于生产环境）

```bash
# 启动完整的服务栈（包括 PostgreSQL）
docker-compose up -d postgres

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f postgres

# 停止服务
docker-compose down
```

---

### 方案 3：使用系统 PostgreSQL 服务

#### Linux (Ubuntu/Debian)

```bash
# 1. 检查服务状态
sudo systemctl status postgresql

# 2. 启动服务
sudo systemctl start postgresql

# 3. 设置开机自启
sudo systemctl enable postgresql

# 4. 创建数据库和用户
sudo -u postgres psql << EOF
CREATE USER edugenius WITH PASSWORD 'edugenius';
CREATE DATABASE edugenius OWNER edugenius;
GRANT ALL PRIVILEGES ON DATABASE edugenius TO edugenius;
EOF

# 5. 配置远程连接（可选）
sudo nano /etc/postgresql/*/main/pg_hba.conf
# 添加：host    all    all    0.0.0.0/0    md5

# 6. 重启服务
sudo systemctl restart postgresql
```

#### Linux (CentOS/RHEL)

```bash
# 1. 安装 PostgreSQL
sudo yum install postgresql-server

# 2. 初始化数据库
sudo postgresql-setup initdb

# 3. 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 其他步骤同 Ubuntu
```

#### macOS

```bash
# 使用 Homebrew 安装
brew install postgresql@14

# 启动服务
brew services start postgresql@14

# 或手动启动
pg_ctl -D /usr/local/var/postgres start
```

#### Windows

1. 下载并安装 PostgreSQL：https://www.postgresql.org/download/windows/
2. 使用 pgAdmin 启动服务
3. 或通过服务管理器启动：
   - Win+R → `services.msc`
   - 找到 `postgresql-x64-14` 服务
   - 右键 → 启动

---

### 方案 4：使用 SQLite（开发环境）

如果 PostgreSQL 不可用，可以临时使用 SQLite：

```bash
# 安装 SQLite 依赖
pip install sqlite3

# 修改 .env 文件
DATABASE_URL=sqlite:///edugenius.db
```

**注意**：SQLite 不适合生产环境，仅用于开发测试。

---

## 🧪 验证解决方案

### 测试 PostgreSQL 连接

```python
import psycopg2

try:
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='postgres',
        database='edugenius'
    )
    print("✅ 数据库连接成功！")
    conn.close()
except Exception as e:
    print(f"❌ 连接失败: {e}")
```

### 使用命令行测试

```bash
# 连接数据库
psql -h localhost -p 5432 -U postgres -d edugenius

# 或使用 Docker
docker exec -it edugenius-postgres psql -U postgres -d edugenius
```

---

## 📝 配置 .env 文件

创建或编辑 `.env` 文件：

```env
# Docker PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/edugenius

# 或自定义配置
# DATABASE_URL=postgresql://username:password@host:port/database
```

---

## 🔄 初始化数据库

数据库连接成功后，初始化数据库表：

```bash
# 使用 Docker
docker exec -it edugenius-app python scripts/init_db.py

# 或直接运行
python scripts/init_db.py
```

---

## 🛡️ 避免连接被关闭的配置

### PostgreSQL 配置优化

编辑 `postgresql.conf`：

```ini
# 最大连接数
max_connections = 100

# 连接超时（秒）
tcp_keepalives_idle = 60
tcp_keepalives_interval = 10
tcp_keepalives_count = 6

# 空闲连接超时
idle_in_transaction_session_timeout = 600000  # 10分钟

# 语句超时
statement_timeout = 300000  # 5分钟
```

重启服务使配置生效：

```bash
# Docker
docker restart edugenius-postgres

# 系统服务
sudo systemctl restart postgresql
```

---

## 📊 连接池配置

使用连接池避免频繁创建连接：

```python
from psycopg2 import pool

# 创建连接池
connection_pool = pool.SimpleConnectionPool(
    1,  # 最小连接数
    10, # 最大连接数
    host='localhost',
    port=5432,
    user='postgres',
    password='postgres',
    database='edugenius'
)

# 获取连接
conn = connection_pool.getconn()

# 使用连接
cur = conn.cursor()
cur.execute("SELECT 1")

# 释放连接
connection_pool.putconn(conn)
```

---

## 🚨 故障排查

### 查看数据库日志

```bash
# Docker
docker logs edugenius-postgres

# Linux
sudo tail -f /var/log/postgresql/*.log

# macOS
tail -f /usr/local/var/log/postgres.log
```

### 检查端口占用

```bash
# Linux/macOS
lsof -i :5432

# 或
netstat -tlnp | grep 5432
```

### 检查连接数

```sql
-- 连接到数据库后执行
SELECT count(*) FROM pg_stat_activity;

-- 查看活跃连接
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- 终止特定连接
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'edugenius';
```

---

## 📞 获取帮助

如果问题仍未解决：

1. **运行诊断脚本**
   ```bash
   python scripts/fix_local_database.py
   ```

2. **提交 Issue**
   - 提供完整的错误信息
   - 附上操作系统和 PostgreSQL 版本
   - 提供数据库日志内容

3. **查看文档**
   - [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
   - [项目部署指南](./DEPLOYMENT.md)

---

## 🎯 推荐方案

**开发环境**：使用 Docker（方案1）
```bash
docker run -d --name edugenius-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=edugenius \
  -p 5432:5432 \
  postgres:14-alpine
```

**生产环境**：使用 Docker Compose（方案2）
```bash
docker-compose up -d
```

---

**希望这些解决方案能帮助您解决数据库连接问题！** 🚀
