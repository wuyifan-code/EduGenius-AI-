#!/usr/bin/env python3
"""
数据库连接问题快速解决工具
自动检测环境并选择最佳解决方案
"""

import os
import sys
import subprocess
from pathlib import Path

# 颜色定义
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
CYAN = '\033[0;36m'
NC = '\033[0m'

def print_header(msg):
    print("\n" + "="*60)
    print(f"  {msg}")
    print("="*60 + "\n")

def print_info(msg):
    print(f"{BLUE}[INFO]{NC} {msg}")

def print_success(msg):
    print(f"{GREEN}[OK]{NC} {msg}")

def print_warn(msg):
    print(f"{YELLOW}[WARN]{NC} {msg}")

def print_error(msg):
    print(f"{RED}[ERROR]{NC} {msg}")

def print_option(num, msg):
    print(f"{CYAN}[{num}]{NC} {msg}")

def check_docker():
    """检查 Docker 是否可用"""
    try:
        result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def check_postgres():
    """检查 PostgreSQL 是否安装"""
    try:
        result = subprocess.run(['psql', '--version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def start_docker_postgres():
    """使用 Docker 启动 PostgreSQL"""
    print_info("使用 Docker 启动 PostgreSQL...")

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
        print_success("PostgreSQL 容器启动成功")
        print_info("等待数据库就绪...")
        import time
        time.sleep(5)
        return True
    else:
        print_error(f"启动失败: {result.stderr}")
        return False

def init_sqlite():
    """初始化 SQLite 数据库"""
    print_info("初始化 SQLite 数据库...")

    try:
        result = subprocess.run([sys.executable, 'scripts/init_sqlite.py'], capture_output=True, text=True)
        print(result.stdout)
        return result.returncode == 0
    except Exception as e:
        print_error(f"初始化失败: {e}")
        return False

def main():
    print_header("EduGenius AI 数据库问题解决工具")

    # 检查环境
    has_docker = check_docker()
    has_postgres = check_postgres()

    print_info("环境检测结果：")
    print(f"  Docker: {'✅ 已安装' if has_docker else '❌ 未安装'}")
    print(f"  PostgreSQL: {'✅ 已安装' if has_postgres else '❌ 未安装'}")
    print()

    # 提供解决方案
    print("请选择解决方案：")
    print()

    if has_docker:
        print_option(1, "使用 Docker 启动 PostgreSQL（推荐）")
        print("   - 快速启动，无需配置")
        print("   - 独立运行，环境隔离")
        print("   - 适合开发和测试")
        print()

    if has_postgres:
        print_option(2, "使用本地 PostgreSQL 服务")
        print("   - 利用已安装的 PostgreSQL")
        print("   - 需要手动启动服务")
        print("   - 适合本地开发")
        print()

    print_option(3, "使用 SQLite（临时方案）")
    print("   - 无需额外服务")
    print("   - 仅适用于开发环境")
    print("   - 快速体验，不推荐生产")
    print()

    print_option(0, "退出")
    print()

    choice = input("请输入选项 [0-3]: ").strip()

    if choice == '1' and has_docker:
        print_header("方案 1: 使用 Docker 启动 PostgreSQL")
        if start_docker_postgres():
            print_success("数据库已启动！")
            print_info("连接信息：")
            print("  主机: localhost")
            print("  端口: 5432")
            print("  用户: postgres")
            print("  密码: postgres")
            print("  数据库: edugenius")
            print()
            print_info("下一步：")
            print("  1. 初始化数据库: python scripts/init_db.py")
            print("  2. 启动应用: python src/main.py -m http -p 8000")
            return 0
        else:
            print_error("数据库启动失败")
            return 1

    elif choice == '2' and has_postgres:
        print_header("方案 2: 使用本地 PostgreSQL")
        print_info("请手动启动 PostgreSQL 服务：")
        print()
        print("Linux:")
        print("  sudo systemctl start postgresql")
        print()
        print("macOS:")
        print("  brew services start postgresql@14")
        print()
        print("Windows:")
        print("  使用服务管理器启动 PostgreSQL 服务")
        print()
        print_info("启动后，运行以下命令初始化数据库：")
        print("  python scripts/init_db.py")
        return 0

    elif choice == '3':
        print_header("方案 3: 使用 SQLite")
        if init_sqlite():
            print_success("SQLite 数据库已就绪！")
            print_info("下一步：")
            print("  启动应用: python src/main.py -m http -p 8000")
            return 0
        else:
            print_error("SQLite 初始化失败")
            return 1

    elif choice == '0':
        print_info("退出")
        return 0

    else:
        print_error("无效的选项")
        return 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n操作已取消")
        sys.exit(1)
