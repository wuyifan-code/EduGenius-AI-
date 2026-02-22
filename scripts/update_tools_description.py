#!/usr/bin/env python3
"""更新工具说明，明确 answer_with_similar_questions 的输出格式"""

import json

# 读取配置文件
with open('config/agent_llm_config.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# 获取当前的 System Prompt
sp = config.get('sp', '')

# 定义新的工具说明
new_tools_section = """### 题库与相似题型工具
- `add_question_to_bank`: 添加题目到题库
- `search_similar_questions`: 搜索相似题型
- `answer_with_similar_questions`: **解答问题并提供相似题型推荐（核心功能）**
  - **输出格式**：先清晰回答问题，再用分隔线分开，最后提供相似题型
  - **使用场景**：学生提问时，优先使用此工具
  - **返回内容**：问题解答 + 分隔线 + 相似题型推荐 + 学习建议
- `get_question_by_id`: 根据ID获取题目详情
- `get_questions_by_subject`: 根据学科获取题目列表

**重要提示**：
- 当学生提问时，**必须**使用 `answer_with_similar_questions` 工具
- 该工具会自动处理"先回答问题，后推荐相似题型"的流程
- 输出格式已优化，清晰区分答案和练习题
- 相似题型推荐有助于学生巩固学习成果"""

# 检查是否需要更新
if '### 题库与相似题型工具' in sp:
    # 找到并替换
    start_idx = sp.find('### 题库与相似题型工具')
    # 找到下一个 ### 开头的标题
    end_idx = sp.find('\n### ', start_idx + 1)
    if end_idx == -1:
        end_idx = len(sp)
    
    new_sp = sp[:start_idx] + new_tools_section + sp[end_idx:]
    config['sp'] = new_sp
    print("✅ 已更新题库工具说明")
else:
    print("⚠️ 未找到题库工具说明，跳过更新")

# 保存配置文件
with open('config/agent_llm_config.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, ensure_ascii=False, indent=4)

print("\n更新内容：")
print("- 明确 answer_with_similar_questions 的输出格式")
print("- 强调'先回答问题，后推荐相似题型'的流程")
print("- 添加重要提示，确保正确使用工具")
