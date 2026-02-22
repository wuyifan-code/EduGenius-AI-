#!/bin/bash

# EduGenius AI 快速部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    log_info "系统依赖检查通过 ✓"
}

# 配置环境变量
setup_env() {
    log_info "配置环境变量..."

    if [ ! -f .env ]; then
        log_warn ".env 文件不存在，从 .env.example 创建..."

        if [ -f .env.example ]; then
            cp .env.example .env
            log_info "已创建 .env 文件，请修改其中的配置"
            log_warn "特别是以下配置项："
            log_warn "  - DATABASE_URL: 数据库连接"
            log_warn "  - S3_ACCESS_KEY / S3_SECRET_KEY: 对象存储密钥"
            log_warn "  - ALIYUN_ACCESS_KEY / ALIYUN_ACCESS_KEY_SECRET: 阿里云密钥"
            log_warn "  - COZE_INTEGRATION_MODEL_BASE_URL: 大模型端点"
            echo ""
            read -p "是否现在编辑 .env 文件？(y/n): " edit_env
            if [ "$edit_env" = "y" ] || [ "$edit_env" = "Y" ]; then
                ${EDITOR:-vi} .env
            fi
        else
            log_error ".env.example 文件不存在"
            exit 1
        fi
    else
        log_info ".env 文件已存在 ✓"
    fi
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    docker-compose build --no-cache
    log_info "Docker 镜像构建完成 ✓"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."

    # 等待 PostgreSQL 就绪
    log_info "等待 PostgreSQL 启动..."
    docker-compose exec -T postgres pg_isready -U postgres || {
        log_error "PostgreSQL 启动失败"
        exit 1
    }

    # 执行数据库初始化
    if [ -f scripts/init_db.py ]; then
        docker-compose exec -T app python scripts/init_db.py
        log_info "数据库初始化完成 ✓"
    else
        log_warn "未找到 scripts/init_db.py，跳过数据库初始化"
    fi
}

# 启动服务
start_services() {
    log_info "启动服务..."
    docker-compose up -d
    log_info "服务启动完成 ✓"
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    docker-compose down
    log_info "服务已停止 ✓"
}

# 查看日志
view_logs() {
    docker-compose logs -f "$@"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    docker-compose restart
    log_info "服务已重启 ✓"
}

# 检查服务状态
check_status() {
    log_info "服务状态："
    docker-compose ps
}

# 更新代码
update_code() {
    log_info "更新代码..."
    git pull
    build_images
    restart_services
    log_info "代码更新完成 ✓"
}

# 备份数据
backup_data() {
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    log_info "备份数据到 $BACKUP_DIR..."

    # 备份数据库
    docker-compose exec -T postgres pg_dump -U postgres edugenius > "$BACKUP_DIR/database.sql"

    # 备份 assets
    cp -r assets "$BACKUP_DIR/" 2>/dev/null || true

    log_info "数据备份完成 ✓"
}

# 显示帮助
show_help() {
    cat << EOF
EduGenius AI 部署脚本

用法: $0 [命令] [选项]

命令:
  check       检查系统依赖
  env         配置环境变量
  build       构建 Docker 镜像
  init        初始化数据库
  start       启动服务
  stop        停止服务
  restart     重启服务
  logs        查看日志
  status      查看服务状态
  update      更新代码
  backup      备份数据
  help        显示帮助信息

选项:
  -h, --help  显示帮助信息

示例:
  $0 check       # 检查依赖
  $0 build       # 构建镜像
  $0 start       # 启动服务
  $0 logs app    # 查看应用日志
  $0 backup      # 备份数据

EOF
}

# 主函数
main() {
    case "${1:-help}" in
        check)
            check_dependencies
            ;;
        env)
            setup_env
            ;;
        build)
            check_dependencies
            setup_env
            build_images
            ;;
        init)
            init_database
            ;;
        start)
            check_dependencies
            setup_env
            build_images
            start_services
            init_database
            log_info ""
            log_info "======================================"
            log_info "服务已启动！"
            log_info "======================================"
            log_info "访问地址: http://localhost:8000"
            log_info "查看日志: $0 logs"
            log_info "停止服务: $0 stop"
            log_info "======================================"
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            shift
            view_logs "$@"
            ;;
        status)
            check_status
            ;;
        update)
            update_code
            ;;
        backup)
            backup_data
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
