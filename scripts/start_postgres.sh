#!/bin/bash

# EduGenius AI - 快速启动 PostgreSQL

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装"
    log_info "请安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 容器名称
CONTAINER_NAME="edugenius-postgres"

# 检查容器是否已存在
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_info "发现已存在的容器: ${CONTAINER_NAME}"

    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_success "容器已在运行"
    else
        log_info "启动容器..."
        docker start ${CONTAINER_NAME}
        log_success "容器已启动"
    fi
else
    log_info "创建新容器..."

    # 创建数据卷
    docker volume create edugenius_postgres_data 2>/dev/null || true

    # 启动容器
    docker run -d \
        --name ${CONTAINER_NAME} \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=edugenius \
        -p 5432:5432 \
        -v edugenius_postgres_data:/var/lib/postgresql/data \
        --health-cmd="pg_isready -U postgres" \
        --health-interval=10s \
        --health-timeout=5s \
        --health-retries=5 \
        postgres:14-alpine

    log_success "容器已创建"
fi

# 等待数据库就绪
log_info "等待数据库启动..."
for i in {1..30}; do
    if docker exec ${CONTAINER_NAME} pg_isready -U postgres &> /dev/null; then
        log_success "数据库已就绪！"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# 显示容器信息
log_info "容器信息："
docker ps --filter name=${CONTAINER_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 测试连接
log_info "测试数据库连接..."
if docker exec ${CONTAINER_NAME} psql -U postgres -d edugenius -c "SELECT version();" &> /dev/null; then
    log_success "数据库连接成功！"
else
    log_warn "数据库连接测试失败，但容器正在运行"
fi

echo ""
log_success "========================================"
log_success "  PostgreSQL 已启动成功！"
log_success "========================================"
echo ""
log_info "数据库信息："
log_info "  主机: localhost"
log_info "  端口: 5432"
log_info "  用户: postgres"
log_info "  密码: postgres"
log_info "  数据库: edugenius"
echo ""
log_info "常用命令："
log_info "  查看日志: docker logs ${CONTAINER_NAME}"
log_info "  连接数据库: docker exec -it ${CONTAINER_NAME} psql -U postgres -d edugenius"
log_info "  停止容器: docker stop ${CONTAINER_NAME}"
log_info "  删除容器: docker rm -f ${CONTAINER_NAME}"
echo ""
log_info "下一步："
log_info "  1. 初始化数据库: python scripts/init_db.py"
log_info "  2. 启动应用: python src/main.py -m http -p 8000"
echo ""
