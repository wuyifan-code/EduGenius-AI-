#!/usr/bin/env python3
"""使用 SQLite 替代 PostgreSQL（临时解决方案）"""

import sqlite3
import os
from pathlib import Path

def create_sqlite_database():
    """创建 SQLite 数据库和表"""
    db_path = "edugenius.db"

    print("创建 SQLite 数据库...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 创建学生表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        grade TEXT,
        class_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 创建教师表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        subject TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 创建学习计划表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS learning_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )
    """)

    # 创建学习记录表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS learning_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        record_type TEXT NOT NULL,
        content TEXT,
        duration INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )
    """)

    # 创建题库表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS question_bank (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        difficulty TEXT,
        tags TEXT,
        embedding BLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()

    print(f"✅ SQLite 数据库创建成功: {db_path}")
    print(f"   位置: {os.path.abspath(db_path)}")
    return True

def update_env_file():
    """更新 .env 文件使用 SQLite"""
    env_file = Path('.env')

    # 创建 .env 文件
    if not env_file.exists():
        print("创建 .env 文件...")
        env_file.write_text("")

    # 读取内容
    content = env_file.read_text()

    # 更新或添加 DATABASE_URL
    if 'DATABASE_URL=' in content:
        # 替换现有的 DATABASE_URL
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            if line.startswith('DATABASE_URL='):
                new_lines.append('DATABASE_URL=sqlite:///edugenius.db')
            else:
                new_lines.append(line)
        content = '\n'.join(new_lines)
    else:
        # 添加 DATABASE_URL
        content = f'DATABASE_URL=sqlite:///edugenius.db\n{content}'

    # 写回文件
    env_file.write_text(content)
    print("✅ .env 文件已更新")
    print("   DATABASE_URL=sqlite:///edugenius.db")
    return True

def main():
    print("="*60)
    print("  SQLite 数据库初始化工具")
    print("="*60)
    print()

    # 创建数据库
    create_sqlite_database()
    print()

    # 更新配置文件
    update_env_file()
    print()

    print("="*60)
    print("  初始化完成！")
    print("="*60)
    print()
    print("数据库信息：")
    print("  类型: SQLite")
    print("  文件: edugenius.db")
    print("  连接字符串: sqlite:///edugenius.db")
    print()
    print("注意事项：")
    print("  ⚠️  SQLite 仅适用于开发环境")
    print("  ⚠️  生产环境请使用 PostgreSQL")
    print()
    print("下一步：")
    print("  启动应用: python src/main.py -m http -p 8000")
    print()

if __name__ == '__main__':
    main()
