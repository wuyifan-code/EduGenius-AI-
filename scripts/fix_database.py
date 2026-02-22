#!/usr/bin/env python3
"""数据库连接诊断和修复工具"""

import os
import subprocess
import sys
from pathlib import Path

# 颜色定义
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
NC = '\033[0m'  # No Color

def print_info(msg):
    print(f"{BLUE}[INFO]{NC} {msg}")

def print_success(msg):
    print(f"{GREEN}[OK]{NC} {msg}")

def print_warn(msg):
    print(f"{YELLOW}[WARN]{NC} {msg}")

def print_error(msg):
    print(f"{RED}[ERROR]{NC} {msg}")

def check_docker():
    """检查 Docker 是否安装和运行"""
    print_info("检查 Docker 环境...")
    try:
        result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_success(f"Docker 已安装: {result.stdout.strip()}")
            return True
        else:
            print_error("Docker 未安装")
            return False
    except FileNotFoundError:
        print_error("Docker 命令未找到")
        return False

def check_docker_compose():
    """检查 Docker Compose 是否可用"""
    print_info("检查 Docker Compose...")
    try:
        result = subprocess.run(['docker-compose', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_success(f"Docker Compose 已安装: {result.stdout.strip()}")
            return True
        else:
            print_error("Docker Compose 未安装")
            return False
    except FileNotFoundError:
        print_error("Docker Compose 命令未找到")
        return False

def check_postgres_container():
    """检查 PostgreSQL 容器状态"""
    print_info("检查 PostgreSQL 容器...")
    try:
        result = subprocess.run(
            ['docker', 'ps', '-a', '--filter', 'name=edugenius-postgres', '--format', '{{.Status}}'],
            capture_output=True, text=True
        )
        if result.stdout.strip():
            status = result.stdout.strip()
            if 'Up' in status:
                print_success(f"PostgreSQL 容器运行中: {status}")
                return True
            else:
                print_warn(f"PostgreSQL 容器未运行: {status}")
                return False
        else:
            print_warn("未找到 PostgreSQL 容器")
            return False
    except Exception as e:
        print_error(f"检查容器失败: {e}")
        return False

def start_postgres_container():
    """启动 PostgreSQL 容器"""
    print_info("启动 PostgreSQL 容器...")
    try:
        result = subprocess.run(
            ['docker', 'start', 'edugenius-postgres'],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            print_success("PostgreSQL 容器启动成功")
            return True
        else:
            print_error(f"启动失败: {result.stderr}")
            return False
    except Exception as e:
        print_error(f"启动容器失败: {e}")
        return False

def create_postgres_container():
    """创建新的 PostgreSQL 容器"""
    print_info("创建 PostgreSQL 容器...")
    try:
        # 检查容器是否已存在
        result = subprocess.run(
            ['docker', 'ps', '-a', '--filter', 'name=edugenius-postgres', '--format', '{{.Names}}'],
            capture_output=True, text=True
        )
        if result.stdout.strip():
            print_warn("PostgreSQL 容器已存在，尝试删除旧容器...")
            subprocess.run(['docker', 'rm', '-f', 'edugenius-postgres'], capture_output=True)

        # 创建新容器
        cmd = [
            'docker', 'run', '-d',
            '--name', 'edugenius-postgres',
            '-e', 'POSTGRES_USER=postgres',
            '-e', 'POSTGRES_PASSWORD=postgres',
            '-e', 'POSTGRES_DB=edugenius',
            '-p', '5432:5432',
            '-v', 'edugenius_postgres_data:/var/lib/postgresql/data',
            'postgres:14-alpine'
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print_success("PostgreSQL 容器创建成功")
            print_info("等待数据库启动...")
            import time
            time.sleep(5)
            return True
        else:
            print_error(f"创建失败: {result.stderr}")
            return False
    except Exception as e:
        print_error(f"创建容器失败: {e}")
        return False

def test_database_connection():
    """测试数据库连接"""
    print_info("测试数据库连接...")
    try:
        import psycopg2
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='postgres',
            database='edugenius'
        )
        print_success("数据库连接成功！")
        conn.close()
        return True
    except psycopg2.OperationalError as e:
        print_error(f"数据库连接失败: {e}")
        return False
    except ImportError:
        print_warn("未安装 psycopg2，跳过连接测试")
        return None

def check_env_file():
    """检查 .env 文件"""
    print_info("检查 .env 文件...")
    env_file = Path('.env')
    if env_file.exists():
        print_success(".env 文件存在")
        with open(env_file, 'r') as f:
            content = f.read()
            if 'DATABASE_URL' in content:
                print_success("DATABASE_URL 配置已找到")
                return True
            else:
                print_warn("DATABASE_URL 未配置")
                return False
    else:
        print_warn(".env 文件不存在，创建中...")
        if Path('.env.example').exists():
            subprocess.run(['cp', '.env.example', '.env'])
            print_success(".env 文件已创建")
            return True
        else:
            print_error(".env.example 文件不存在")
            return False

def main():
    """主函数"""
    print("\n" + "="*60)
    print("  EduGenius AI 数据库诊断工具")
    print("="*60 + "\n")

    # 1. 检查 Docker
    docker_ok = check_docker()
    print()

    if not docker_ok:
        print_error("Docker 未安装，无法使用容器化数据库")
        print_info("请安装 Docker: https://docs.docker.com/get-docker/")
        return 1

    # 2. 检查环境配置
    check_env_file()
    print()

    # 3. 检查容器状态
    container_exists = check_postgres_container()
    print()

    if not container_exists:
        print_info("PostgreSQL 容器不存在，创建中...")
        if not create_postgres_container():
            return 1
        print()

    # 4. 启动容器
    container_running = check_postgres_container()
    if not container_running:
        print_info("启动 PostgreSQL 容器...")
        if not start_postgres_container():
            return 1
        print()

    # 5. 测试连接
    connection_ok = test_database_connection()
    print()

    if connection_ok:
        print_success("="*60)
        print("  数据库诊断完成 - 一切正常！")
        print("="*60)
        print("\n下一步操作：")
        print("  1. 初始化数据库: python scripts/init_db.py")
        print("  2. 启动应用: python src/main.py -m http -p 8000")
        print()
        return 0
    elif connection_ok is False:
        print_error("="*60)
        print("  数据库连接失败，请检查配置")
        print("="*60)
        print("\n可能的原因：")
        print("  1. 数据库正在启动，请稍后再试")
        print("  2. 端口 5432 被占用")
        print("  3. 数据库密码不正确")
        print("\n解决方案：")
        print("  1. 查看容器日志: docker logs edugenius-postgres")
        print("  2. 重启容器: docker restart edugenius-postgres")
        print("  3. 检查端口占用: lsof -i :5432")
        print()
        return 1
    else:
        print_info("="*60)
        print("  数据库配置完成，请手动测试连接")
        print("="*60)
        return 0

if __name__ == '__main__':
    sys.exit(main())
