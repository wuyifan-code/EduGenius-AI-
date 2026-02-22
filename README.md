# EduGenius AI - 智能教育助手

<div align="center">
<img width="1200" height="475" alt="EduGenius AI" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![LangChain](https://img.shields.io/badge/LangChain-1.0-green.svg)](https://langchain.com/)

EduGenius AI 是一个服务于教育机构的智能AI助手，提供教师辅助、学生监督、个性化学习计划、智能问答等功能。

## ✨ 核心功能

- 🎯 **智能问答**：自动推荐相似题型，巩固学习成果
- 🎙️ **实时语音对话**：延迟1.5-2.5秒，像打电话一样流畅
- 📞 **电话通话**：AI自动拨打电话通知
- 📚 **题库管理**：智能相似度搜索
- 🛠️ **58个教育工具**：涵盖教学全流程

## 🚀 快速开始

### 一键启动（推荐）

```bash
git clone https://github.com/wuyifan-code/EduGenius-AI-.git
cd EduGenius-AI-

# 运行启动脚本
bash scripts/start.sh
```

启动脚本会自动：
- ✅ 检查环境依赖
- ✅ 安装所需库
- ✅ 配置环境变量
- ✅ 启动 HTTP 服务

选择启动方式：
- [1] HTTP 服务（浏览器访问）
- [2] 命令行交互
- [3] 运行测试
- [4] 查看文档

### 手动启动

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件（可选，默认使用 SQLite）

# 3. 启动服务
python src/main.py -m http -p 8000
```

访问：http://localhost:8000

## 📖 使用方式

### 1. 本地使用

```bash
# 方式1：HTTP 服务
bash scripts/start.sh

# 方式2：命令行交互
python src/main.py -m cli

# 方式3：API 调用
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "解释牛顿第二定律"}'
```

### 2. Docker 部署

```bash
# 快速部署
bash scripts/deploy.sh start

# 或使用 docker-compose
docker-compose up -d
```

### 3. 云平台部署

- 阿里云 ECS
- 腾讯云 CVM
- AWS EC2

详细步骤：[部署指南](docs/DEPLOYMENT.md)

## 📚 文档

- 📘 [使用指南](docs/USER_GUIDE.md) - 详细的使用教程
- 📗 [快速开始](docs/QUICK_START.md) - 5分钟上手
- 📙 [部署指南](docs/DEPLOYMENT.md) - 生产环境部署
- 📓 [问答格式](docs/QA_FORMAT_GUIDE.md) - 智能问答格式说明
- 📔 [思维链显示](docs/THINKING_DISPLAY.md) - 思考过程控制
- 📕 [数据库故障排查](docs/DATABASE_TROUBLESHOOTING.md) - 数据库问题解决

## 🎯 核心功能演示

### 智能问答（带相似题型）

**输入**：
```
如何计算圆的面积？
```

**输出**：
```
## 📖 你的问题
如何计算圆的面积？

## ✅ 老师的解答

**答案**：圆的面积公式为 S = πr²

**解题思路**：
1. 确定圆的半径 r
2. 使用面积公式 S = πr²
3. 代入数值计算

**知识点**：圆的面积、π（圆周率）、半径

**易错点**：
- 混淆半径和直径
- 记错公式（如误用 2πr）

──────────────────────────────────────────────

## 📚 相似题型推荐（巩固练习）

为了帮助你巩固这个知识点，老师为你准备了 **3** 道相似题目...

[练习题内容]
```

### 实时语音对话

延迟优化至1.5-2.5秒，体验像打电话一样流畅！

```python
# 使用实时语音对话
realtime_voice_qa("解释牛顿第一定律", subject="physics")
```

### 电话通话

AI自动拨打电话，语音播报学习解答：

```python
# 发起电话通话
make_ai_phone_call(
    phone_number="13800138000",
    message="你的作业已完成，请查收"
)
```

## 🛠️ 技术栈

- **Agent框架**: LangChain + LangGraph
- **大模型**: 豆包 (doubao-seed-2-0-pro-260215)
- **数据库**: PostgreSQL / SQLite
- **对象存储**: S3兼容
- **语音服务**: 阿里云语音
- **向量计算**: Embedding + 余弦相似度

## 📊 项目结构

```
.
├── src/
│   ├── agents/          # Agent 实现
│   ├── tools/           # 58个教育工具
│   ├── storage/         # 数据库和存储
│   └── main.py          # 主入口
├── config/              # 配置文件
├── docs/                # 文档
├── scripts/             # 脚本
├── tests/               # 测试
└── requirements.txt     # 依赖
```

## 🎓 应用场景

- **教师辅助**：备课、出题、批改作业
- **学生辅导**：智能答疑、相似题型推荐
- **在线教育**：24/7 答疑、自动批改
- **教育机构**：智能客服、家校沟通

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目地址：https://github.com/wuyifan-code/EduGenius-AI-
- 问题反馈：提交 Issue

---

<div align="center">
**EduGenius AI - 让教育更智能** 🎓
</div>


