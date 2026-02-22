#!/usr/bin/env python3
"""本地数据库连接问题解决方案"""

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

def check_postgres_service():
    """检查 PostgreSQL 服务状态"""
    print_info("检查 PostgreSQL 服务状态...")

    # 检查服务是否运行
    try:
        result = subprocess.run(['pg_isready', '-h', 'localhost', '-p', '5432'],
                              capture_output=True, text=True)
        if result.returncode == 0:
            print_success("PostgreSQL 服务运行正常")
            return True
        else:
            print_warn("PostgreSQL 服务未运行或无响应")
            return False
    except FileNotFoundError:
        print_warn("pg_isready 命令未找到，尝试其他方式检查")
        # 检查进程
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        if 'postgres' in result.stdout:
            print_success("发现 PostgreSQL 进程")
            return True
        else:
            print_error("未发现 PostgreSQL 进程")
            return False

def start_postgres_service():
    """启动 PostgreSQL 服务"""
    print_info("尝试启动 PostgreSQL 服务...")

    # 尝试使用 systemd
    try:
        result = subprocess.run(['systemctl', 'start', 'postgresql'],
                              capture_output=True, text=True)
        if result.returncode == 0:
            print_success("PostgreSQL 服务已启动（systemctl）")
            return True
        else:
            print_warn(f"systemctl 启动失败: {result.stderr}")
    except FileNotFoundError:
        pass

    # 尝试使用 service
    try:
        result = subprocess.run(['service', 'postgresql', 'start'],
                              capture_output=True, text=True)
        if result.returncode == 0:
            print_success("PostgreSQL 服务已启动（service）")
            return True
        else:
            print_warn(f"service 启动失败: {result.stderr}")
    except FileNotFoundError:
        pass

    print_error("无法启动 PostgreSQL 服务")
    return False

def check_database_exists():
    """检查数据库是否存在"""
    print_info("检查 edugenius 数据库是否存在...")

    try:
        import psycopg2
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='postgres',
            database='postgres'  # 连接到默认数据库
        )
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname='edugenius'")
        exists = cur.fetchone() is not None
        conn.close()

        if exists:
            print_success("edugenius 数据库存在")
            return True
        else:
            print_warn("edugenius 数据库不存在")
            return False
    except Exception as e:
        print_error(f"检查数据库失败: {e}")
        return False

def create_database():
    """创建数据库"""
    print_info("创建 edugenius 数据库...")

    try:
        import psycopg2
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='postgres',
            database='postgres'
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("CREATE DATABASE edugenius")
        conn.close()
        print_success("数据库创建成功")
        return True
    except Exception as e:
        print_error(f"创建数据库失败: {e}")
        return False

def check_env_file():
    """检查 .env 文件"""
    print_info("检查 .env 文件...")
    env_file = Path('.env')
    if env_file.exists():
        print_success(".env 文件存在")
        with open(env_file, 'r') as f:
            content = f.read()
            if 'DATABASE_URL' in content:
                # 提取数据库URL
                for line in content.split('\n'):
                    if line.startswith('DATABASE_URL='):
                        print_success(f"数据库配置: {line[:30]}...")
                        return True
            else:
                print_warn("DATABASE_URL 未配置")
                return False
    else:
        print_warn(".env 文件不存在，创建中...")
        if Path('.env.example').exists():
            subprocess.run(['cp', '.env.example', '.env'])
            print_success(".env 文件已创建（使用默认配置）")
            return True
        else:
            print_error(".env.example 文件不存在")
            return False

def check_database_connection():
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
        error_msg = str(e)
        print_error(f"数据库连接失败")

        # 分析错误原因
        if "connection refused" in error_msg.lower():
            print_warn("  原因：连接被拒绝，可能是服务未启动")
            print_info("  解决：启动 PostgreSQL 服务")
        elif "authentication failed" in error_msg.lower():
            print_warn("  原因：认证失败，用户名或密码错误")
            print_info("  解决：检查 .env 文件中的数据库配置")
        elif "database \"edugenius\" does not exist" in error_msg.lower():
            print_warn("  原因：数据库不存在")
            print_info("  解决：运行 init_db.py 创建数据库")
        elif "terminating connection" in error_msg.lower():
            print_warn("  原因：连接被管理员关闭")
            print_info("  解决：重启 PostgreSQL 服务")
        else:
            print_warn(f"  原因：{error_msg}")

        return False
    except ImportError:
        print_warn("未安装 psycopg2，跳过连接测试")
        print_info("  安装：pip install psycopg2-binary")
        return None

def main():
    """主函数"""
    print("\n" + "="*60)
    print("  EduGenius AI 数据库连接问题诊断")
    print("="*60 + "\n")

    # 1. 检查环境配置
    print_info("步骤 1: 检查配置文件")
    env_ok = check_env_file()
    print()

    if not env_ok:
        print_error("配置文件检查失败，请手动创建 .env 文件")
        return 1

    # 2. 检查 PostgreSQL 服务
    print_info("步骤 2: 检查 PostgreSQL 服务")
    service_ok = check_postgres_service()
    print()

    if not service_ok:
        print_info("尝试启动 PostgreSQL 服务...")
        if start_postgres_service():
            print()
            service_ok = check_postgres_service()
        else:
            print("\n" + "="*60)
            print("  PostgreSQL 服务启动失败")
            print("="*60)
            print("\n请手动启动 PostgreSQL：")
            print("  - Ubuntu/Debian: sudo systemctl start postgresql")
            print("  - CentOS/RHEL: sudo systemctl start postgresql")
            print("  - macOS: brew services start postgresql")
            print("  - Windows: 使用服务管理器启动")
            print()
            return 1

    # 3. 测试连接
    print_info("步骤 3: 测试数据库连接")
    connection_ok = check_database_connection()
    print()

    if connection_ok:
        print_success("="*60)
        print("  数据库连接成功！")
        print("="*60)
        print("\n下一步操作：")
        print("  1. 初始化数据库表: python scripts/init_db.py")
        print("  2. 启动应用: python src/main.py -m http -p 8000")
        print()
        return 0

    elif connection_ok is False:
        # 检查数据库是否存在
        print_info("步骤 4: 检查数据库是否存在")
        db_exists = check_database_exists()
        print()

        if not db_exists:
            print_info("尝试创建数据库...")
            if create_database():
                print()
                # 重新测试连接
                connection_ok = check_database_connection()

        if connection_ok:
            print_success("="*60)
            print("  数据库配置完成！")
            print("="*60)
            print("\n下一步操作：")
            print("  1. 初始化数据库表: python scripts/init_db.py")
            print("  2. 启动应用: python src/main.py -m http -p 8000")
            print()
            return 0
        else:
            print_error("="*60)
            print("  数据库连接失败")
            print("="*60)
            print("\n请检查：")
            print("  1. PostgreSQL 服务是否运行")
            print("  2. 端口 5432 是否被占用: lsof -i :5432")
            print("  3. 用户名和密码是否正确")
            print("  4. 数据库是否存在")
            print("\n查看 PostgreSQL 日志：")
            print("  - Linux: sudo tail -f /var/log/postgresql/*.log")
            print("  - macOS: tail -f /usr/local/var/log/postgres.log")
            print()
            return 1
    else:
        print_info("无法测试连接，请手动验证")
        return 0

if __name__ == '__main__':
    sys.exit(main())
