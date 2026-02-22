#!/usr/bin/env python3
"""添加思维链显示开关到配置文件"""

import json

# 读取配置文件
with open('config/agent_llm_config.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# 添加思维链显示开关（如果不存在）
if 'show_thinking' not in config.get('config', {}):
    config['config']['show_thinking'] = False

# 获取当前的 sp
sp = config.get('sp', '')

# 添加思维链显示控制说明到 sp
thinking_instruction = """

## 思维链显示控制

根据配置，当前思维链显示状态：**已关闭**（默认）

### 当思维链显示开启时：
在回答用户之前，先展示你的思考过程，使用以下格式：

```
💭 思考过程：
1. 分析用户需求...
2. 确定需要使用的工具...
3. 预期输出结果...

---

回答：
[你的正式回答]
```

### 当思维链显示关闭时（当前状态）：
直接给出最终答案，不展示思考过程。你的思考过程在后台进行，不需要向用户展示。

### 使用建议
- 开启思考过程显示：适合教学场景，让学生理解问题的分析思路
- 关闭思考过程显示：适合快速问答场景，直接给出结果
- 管理员可以通过修改配置文件中的 `show_thinking` 字段来控制此功能
"""

# 检查是否已经包含思维链说明
if '思维链显示控制' not in sp:
    # 在约束条件之前插入
    if '## 约束条件' in sp:
        config['sp'] = sp.replace('## 约束条件', thinking_instruction + '\n\n## 约束条件')
    else:
        config['sp'] = sp + thinking_instruction

# 保存配置文件
with open('config/agent_llm_config.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, ensure_ascii=False, indent=4)

print("✅ 思维链显示开关已添加到配置文件")
print(f"   当前状态：{'开启' if config['config'].get('show_thinking') else '关闭'}")
print("\n提示：修改 config/agent_llm_config.json 中的 show_thinking 字段来控制是否显示思考过程")
