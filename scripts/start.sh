#!/bin/bash

# EduGenius AI 快速启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_header() {
    echo ""
    echo "="*60
    echo "  $1"
    echo "="*60
    echo ""
}

# 检查 Python
if ! command -v python3 &> /dev/null; then
    log_error "Python 3 未安装"
    log_info "请安装 Python 3.9+: https://www.python.org/downloads/"
    exit 1
fi

print_header "EduGenius AI - 快速启动向导"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    log_info "创建虚拟环境..."
    python3 -m venv venv
    log_success "虚拟环境创建成功"
fi

# 激活虚拟环境
log_info "激活虚拟环境..."
source venv/bin/activate

# 检查依赖
log_info "检查依赖..."
if ! python -c "import fastapi" 2>/dev/null; then
    log_warn "依赖未安装，正在安装..."
    pip install -r requirements.txt
    log_success "依赖安装完成"
else
    log_success "依赖已安装"
fi

# 检查环境配置
log_info "检查环境配置..."
if [ ! -f ".env" ]; then
    log_warn ".env 文件不存在，创建中..."
    cp .env.example .env

    # 使用 SQLite（最简单）
    sed -i 's|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/edugenius|DATABASE_URL=sqlite:///edugenius.db|g' .env

    log_success ".env 文件已创建（使用 SQLite）"
    log_info "如需使用 PostgreSQL，请手动编辑 .env 文件"
else
    log_success ".env 文件已存在"
fi

echo ""
print_header "选择启动方式"
echo ""
echo "${CYAN}[1]${NC} 启动 HTTP 服务（推荐）"
echo "    - 访问地址: http://localhost:8000"
echo "    - 适合: 浏览器访问、API 调用"
echo ""
echo "${CYAN}[2]${NC} 命令行交互"
echo "    - 直接在命令行中与 AI 对话"
echo "    - 适合: 快速测试"
echo ""
echo "${CYAN}[3]${NC} 运行测试脚本"
echo "    - 运行预设的测试用例"
echo "    - 适合: 功能验证"
echo ""
echo "${CYAN}[4]${NC} 查看帮助文档"
echo ""
echo "${CYAN}[0]${NC} 退出"
echo ""

read -p "请选择 [0-4]: " choice

case $choice in
    1)
        print_header "启动 HTTP 服务"
        log_info "服务将在 http://localhost:8000 启动"
        log_info "按 Ctrl+C 停止服务"
        echo ""
        python src/main.py -m http -p 8000
        ;;
    2)
        print_header "命令行交互"
        log_info "输入 'exit' 或 'quit' 退出"
        echo ""

        python << 'PYTHON_SCRIPT'
import sys
sys.path.insert(0, '.')

from src.agents.agent import build_agent

agent = build_agent()
messages = []

print("🎓 EduGenius AI - 智能教育助手")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("输入你的问题，或输入 'exit' 退出")
print("")

while True:
    try:
        user_input = input("\n你: ").strip()

        if user_input.lower() in ['exit', 'quit', '退出']:
            print("\n👋 再见！")
            break

        if not user_input:
            continue

        print("\nAI: ", end="", flush=True)

        messages.append({"role": "user", "content": user_input})
        response = agent.invoke({"messages": messages})

        # 提取响应文本
        if isinstance(response, dict):
            response_text = response.get("messages", [])
            if response_text:
                last_msg = response_text[-1]
                if hasattr(last_msg, 'content'):
                    print(last_msg.content)
                    messages.append({"role": "assistant", "content": last_msg.content})
                else:
                    print(str(last_msg))
            else:
                print(str(response))
        else:
            print(str(response))

    except KeyboardInterrupt:
        print("\n\n👋 再见！")
        break
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        continue
PYTHON_SCRIPT

        ;;
    3)
        print_header "运行测试脚本"

        python << 'PYTHON_SCRIPT'
import sys
sys.path.insert(0, '.')

from src.agents.agent import build_agent

def test_agent():
    agent = build_agent()

    test_cases = [
        "你好",
        "解释牛顿第二定律",
        "如何计算圆的面积？"
    ]

    print("🧪 运行测试用例\n")

    for i, question in enumerate(test_cases, 1):
        print(f"{'='*60}")
        print(f"测试 {i}: {question}")
        print(f"{'='*60}\n")

        try:
            response = agent.invoke({"messages": [question]})

            # 提取响应文本
            if isinstance(response, dict):
                response_text = response.get("messages", [])
                if response_text:
                    last_msg = response_text[-1]
                    if hasattr(last_msg, 'content'):
                        print(last_msg.content[:200] + "..." if len(last_msg.content) > 200 else last_msg.content)
                    else:
                        print(str(last_msg)[:200])
                else:
                    print(str(response)[:200])
            else:
                print(str(response)[:200])

        except Exception as e:
            print(f"❌ 测试失败: {e}")

        print()

    print(f"{'='*60}")
    print("✅ 测试完成")
    print(f"{'='*60}")

if __name__ == '__main__':
    test_agent()
PYTHON_SCRIPT

        ;;
    4)
        print_header "帮助文档"
        echo ""
        echo "📚 可用文档："
        echo ""
        echo "  1. 使用指南: docs/USER_GUIDE.md"
        echo "  2. 部署指南: docs/DEPLOYMENT.md"
        echo "  3. 快速开始: docs/QUICK_START.md"
        echo "  4. 问答格式: docs/QA_FORMAT_GUIDE.md"
        echo "  5. 数据库故障排查: docs/DATABASE_TROUBLESHOOTING.md"
        echo "  6. 思维链显示: docs/THINKING_DISPLAY.md"
        echo ""
        echo "🌐 在线文档："
        echo "  https://github.com/wuyifan-code/EduGenius-AI-"
        echo ""
        echo "📞 获取帮助："
        echo "  提交 Issue: https://github.com/wuyifan-code/EduGenius-AI-/issues"
        echo ""
        ;;
    0)
        log_info "退出"
        exit 0
        ;;
    *)
        log_error "无效的选项"
        exit 1
        ;;
esac
