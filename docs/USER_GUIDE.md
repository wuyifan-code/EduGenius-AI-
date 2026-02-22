# EduGenius AI 使用指南

本指南将帮助你了解如何使用 EduGenius AI 智能体。

---

## 🚀 快速开始

### 方式1：本地运行（推荐用于开发和测试）

#### 1. 安装依赖

```bash
# 进入项目目录
cd EduGenius-AI-

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
```

#### 2. 配置环境变量

```bash
# 创建 .env 文件
cp .env.example .env

# 编辑 .env 文件
nano .env  # 或使用其他编辑器
```

**最小配置（使用 SQLite）：**
```env
DATABASE_URL=sqlite:///edugenius.db
COZE_INTEGRATION_MODEL_BASE_URL=your-model-endpoint
```

**完整配置（使用 PostgreSQL）：**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/edugenius
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=edugenius-bucket
ALIYUN_ACCESS_KEY=your-aliyun-access-key
ALIYUN_ACCESS_KEY_SECRET=your-aliyun-secret-key
ALIYUN_APP_KEY=your-aliyun-app-key
COZE_INTEGRATION_MODEL_BASE_URL=your-model-endpoint
```

#### 3. 启动 HTTP 服务

```bash
# 方式1：使用脚本
bash scripts/http_run.sh -p 8000

# 方式2：直接运行
python src/main.py -m http -p 8000
```

服务将在 `http://localhost:8000` 启动。

#### 4. 访问服务

打开浏览器访问：`http://localhost:8000`

---

## 💻 命令行使用

### 方式2：命令行交互

```bash
# 运行 Agent
python -c "
from src.agents.agent import build_agent

agent = build_agent()
response = agent.invoke({'messages': ['你好']})
print(response)
"
```

### 使用测试脚本

```bash
# 创建测试脚本
cat > test_agent.py << 'EOF'
from src.agents.agent import build_agent

def test_agent():
    agent = build_agent()

    # 测试1：简单对话
    print("=== 测试1：简单对话 ===")
    response = agent.invoke({'messages': ['你好']})
    print(response)

    # 测试2：数学问题
    print("\n=== 测试2：数学问题 ===")
    response = agent.invoke({'messages': ['解释牛顿第二定律']})
    print(response)

    # 测试3：智能问答（带相似题型）
    print("\n=== 测试3：智能问答 ===")
    response = agent.invoke({'messages': ['如何计算圆的面积？']})
    print(response)

if __name__ == '__main__':
    test_agent()
EOF

# 运行测试
python test_agent.py
```

---

## 🌐 HTTP API 使用

### 方式3：通过 HTTP API 调用

#### 1. 启动服务

```bash
python src/main.py -m http -p 8000
```

#### 2. API 端点

##### 发送消息

```bash
# 发送文本消息
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "解释牛顿第二定律"
  }'
```

##### 流式响应

```bash
# 流式响应
curl -X POST http://localhost:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "如何学习英语？"
  }'
```

#### 3. Python 调用示例

```python
import requests

# 配置
API_URL = "http://localhost:8000/api/chat"

def chat_with_agent(message):
    """与智能体对话"""
    response = requests.post(
        API_URL,
        json={"message": message},
        headers={"Content-Type": "application/json"}
    )
    return response.json()

# 使用
result = chat_with_agent("解释牛顿第二定律")
print(result['response'])
```

#### 4. JavaScript 调用示例

```javascript
// 配置
const API_URL = "http://localhost:8000/api/chat";

async function chatWithAgent(message) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message })
  });

  return await response.json();
}

// 使用
chatWithAgent("解释牛顿第二定律")
  .then(result => console.log(result.response))
  .catch(error => console.error(error));
```

---

## 🐳 Docker 部署

### 方式4：使用 Docker 部署

#### 1. 快速启动

```bash
# 使用部署脚本
bash scripts/deploy.sh start

# 或使用 docker-compose
docker-compose up -d
```

#### 2. 访问服务

服务启动后，访问 `http://localhost:8000`

#### 3. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看应用日志
docker-compose logs -f app
```

---

## ☁️ 云平台部署

### 方式5：部署到云平台

#### 阿里云部署

1. **购买 ECS 实例**
2. **配置环境**
3. **部署代码**
4. **配置域名和 SSL**

详细步骤请参考：[部署指南](./DEPLOYMENT.md)

#### 腾讯云部署

1. **购买 CVM 实例**
2. **部署应用**
3. **配置负载均衡**

#### AWS 部署

1. **使用 EC2 + RDS**
2. **或使用 ECS Fargate**

---

## 🎨 集成到 Web 应用

### 方式6：创建简单的 Web 界面

#### 创建简单的聊天界面

```html
<!DOCTYPE html>
<html>
<head>
    <title>EduGenius AI - 智能教育助手</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        #chat-box { border: 1px solid #ccc; height: 400px; overflow-y: scroll; padding: 10px; margin-bottom: 10px; }
        .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .user { background: #e3f2fd; text-align: right; }
        .ai { background: #f5f5f5; }
        input[type="text"] { width: 70%; padding: 10px; }
        button { padding: 10px 20px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>🎓 EduGenius AI - 智能教育助手</h1>
    <div id="chat-box"></div>
    <input type="text" id="user-input" placeholder="输入你的问题...">
    <button onclick="sendMessage()">发送</button>

    <script>
        const API_URL = 'http://localhost:8000/api/chat';

        function addMessage(content, type) {
            const chatBox = document.getElementById('chat-box');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.innerHTML = content;
            chatBox.appendChild(messageDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        async function sendMessage() {
            const input = document.getElementById('user-input');
            const message = input.value.trim();

            if (!message) return;

            // 显示用户消息
            addMessage(message, 'user');
            input.value = '';

            // 调用 API
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ message })
                });
                const result = await response.json();
                addMessage(result.response, 'ai');
            } catch (error) {
                addMessage(`错误: ${error.message}`, 'ai');
            }
        }

        // 回车发送
        document.getElementById('user-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>
```

保存为 `index.html`，双击打开即可使用。

---

## 📱 移动应用集成

### 方式7：集成到移动应用

#### React Native 示例

```javascript
import React, { useState } from 'react';
import { View, TextInput, Button, Text, ScrollView } from 'react-native';

export default function ChatApp() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // 添加用户消息
    setMessages([...messages, { text: message, type: 'user' }]);
    setMessage('');

    try {
      const response = await fetch('http://your-server.com:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const result = await response.json();

      // 添加 AI 消息
      setMessages(prev => [...prev, { text: result.response, type: 'ai' }]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <ScrollView>
        {messages.map((msg, index) => (
          <View key={index} style={{
            padding: 10,
            margin: 5,
            backgroundColor: msg.type === 'user' ? '#e3f2fd' : '#f5f5f5',
            borderRadius: 5
          }}>
            <Text>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="输入你的问题..."
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="发送" onPress={sendMessage} />
    </View>
  );
}
```

---

## 🔌 第三方平台集成

### 方式8：集成到微信、飞书等平台

#### 微信公众号集成

1. **配置服务器地址**
2. **处理消息**
3. **返回 AI 回复**

#### 飞书机器人集成

使用项目中的飞书集成工具：
```python
from src.tools.feishu_message_tool import send_feishu_message

send_feishu_message("你好，EduGenius AI")
```

---

## 🧪 测试场景

### 测试1：智能问答（带相似题型）

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "如何计算圆的面积？"}'
```

**预期输出**：
- ✅ 圆的面积公式和计算方法
- ✅ 解题思路
- ✅ 相关知识点
- ✅ 3道相似练习题
- ✅ 学习建议

### 测试2：实时语音对话

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "使用实时语音对话功能，解释牛顿第一定律"}'
```

### 测试3：思维链显示

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "开启思维链显示"}'
```

---

## 📊 使用场景

### 1. 教师辅助
- 备课支持
- 生成教学资源
- 批改作业
- 分析学习数据

### 2. 学生辅导
- 智能答疑
- 相似题型推荐
- 个性化学习计划
- 学习进度跟踪

### 3. 在线教育平台
- 集成到网站
- 提供 24/7 答疑
- 自动批改作业
- 生成学习报告

### 4. 教育机构
- 搭建智能客服
- 提供学习咨询
- 家校沟通
- 电话通知

---

## 🔧 配置优化

### 性能优化

```python
# src/main.py 或 config/agent_llm_config.json
{
  "config": {
    "temperature": 0.7,
    "max_tokens": 4096,
    "timeout": 600
  }
}
```

### 功能开关

```python
# 启用/禁用思维链显示
{
  "config": {
    "show_thinking": false  # false=关闭, true=开启
  }
}
```

---

## 📞 获取帮助

### 常见问题

**Q: 如何获取大模型 API？**
A: 需要配置 `COZE_INTEGRATION_MODEL_BASE_URL` 和 API Key。

**Q: 数据库连接失败怎么办？**
A: 参考 [数据库故障排查指南](./DATABASE_TROUBLESHOOTING.md)。

**Q: 如何部署到生产环境？**
A: 参考 [部署指南](./DEPLOYMENT.md)。

**Q: 如何自定义 System Prompt？**
A: 编辑 `config/agent_llm_config.json` 中的 `sp` 字段。

---

## 🎉 下一步

1. ✅ 本地测试
2. ✅ 配置数据库
3. ✅ 部署到服务器
4. ✅ 集成到应用
5. ✅ 优化和定制

---

**开始使用 EduGenius AI，让教育更智能！** 🚀

查看完整文档：https://github.com/wuyifan-code/EduGenius-AI-
