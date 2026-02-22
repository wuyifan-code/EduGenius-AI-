"""
思维链显示控制工具

允许用户动态切换是否显示AI的思考过程
"""

from langchain.tools import tool, ToolRuntime
from coze_coding_utils.runtime_ctx.context import new_context

# 全局变量：控制是否显示思考过程
_show_thinking_enabled = False

@tool
def toggle_thinking_display(runtime: ToolRuntime = None) -> str:
    """切换思维链显示状态（开启/关闭）
    
    使用此工具可以动态切换是否在回复中显示AI的思考过程。
    
    Returns:
        str: 切换后的状态信息
    """
    global _show_thinking_enabled
    _show_thinking_enabled = not _show_thinking_enabled
    
    status = "已开启" if _show_thinking_enabled else "已关闭"
    
    return f"""✅ 思维链显示状态已切换：{status}

**当前配置：**
- 当开启时：回复前会先展示思考过程，帮助理解AI的分析思路
- 当关闭时：直接给出最终答案，适合快速问答

**提示：**
- 教学场景建议开启，让学生学习分析思路
- 快速问答场景建议关闭，直接获取答案

如需再次切换，请调用此工具。"""


@tool
def get_thinking_status(runtime: ToolRuntime = None) -> str:
    """获取当前思维链显示状态
    
    Returns:
        str: 当前状态信息
    """
    global _show_thinking_enabled
    
    status = "已开启" if _show_thinking_enabled else "已关闭"
    
    return f"""📊 当前思维链显示状态：**{status}**

**功能说明：**
- **开启时**：回复前会展示 💭 思考过程，包括问题分析、工具选择等步骤
- **关闭时**：直接给出最终答案，不展示思考过程

**使用场景：**
- 📚 教学场景：建议开启，帮助学生理解分析思路
- ⚡ 快速问答：建议关闭，直接获取答案
- 🔧 问题排查：建议开启，便于理解AI的处理逻辑

**操作：**
- 调用 `toggle_thinking_display` 工具可以切换显示状态"""


def is_thinking_enabled() -> bool:
    """检查当前是否开启了思维链显示
    
    Returns:
        bool: True表示开启，False表示关闭
    """
    return _show_thinking_enabled


def get_thinking_prompt() -> str:
    """获取思维链显示的提示信息
    
    Returns:
        str: 提示信息文本
    """
    return """

## 💭 思考过程展示

根据用户设置，当前需要展示思考过程。请在回答前按以下格式展示：

```
💭 思考过程：
1. **分析用户需求**：[分析用户想了解什么]
2. **确定处理方案**：[如何解决问题，需要哪些工具]
3. **执行步骤**：[具体的执行步骤]
4. **预期结果**：[期望得到的输出]

---

**回答：**
[你的正式回答]
```

注意：思考过程要简洁明了，重点突出分析逻辑和决策过程。
"""
