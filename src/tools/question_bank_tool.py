"""
题库工具 - 提供题库管理和相似题型推荐功能
"""
from langchain.tools import tool
from coze_coding_dev_sdk import LLMClient
from coze_coding_utils.runtime_ctx.context import new_context
from langchain_core.messages import HumanMessage, SystemMessage
import json
from storage.database.question_bank_manager import get_question_bank_manager


@tool
def add_question_to_bank(
    subject: str,
    question_text: str,
    question_type: str,
    correct_answer: str,
    difficulty: int = 3,
    grade_level: str = None,
    topic: str = None,
    options: str = None,
    explanation: str = None,
    tags: str = None
) -> str:
    """添加题目到题库
    
    Args:
        subject: 学科（如数学、英语、物理等）
        question_text: 题目内容
        question_type: 题目类型（single_choice/multiple_choice/true_false/fill_blank/short_answer/essay）
        correct_answer: 正确答案
        difficulty: 难度等级(1-5，1最简单，5最难)
        grade_level: 年级（如初一、初二等）
        topic: 知识点/主题
        options: 选项（选择题使用，JSON字符串格式）
        explanation: 题目解析
        tags: 标签（JSON字符串格式）
    
    Returns:
        添加结果
    """
    try:
        manager = get_question_bank_manager()
        
        # 解析JSON字符串
        options_dict = json.loads(options) if options else None
        tags_dict = json.loads(tags) if tags else None
        
        question_id = manager.add_question(
            subject=subject,
            question_text=question_text,
            question_type=question_type,
            correct_answer=correct_answer,
            difficulty=difficulty,
            grade_level=grade_level,
            topic=topic,
            options=options_dict,
            explanation=explanation,
            tags=tags_dict
        )
        
        return f"✅ 题目添加成功！\n\n题目ID: {question_id}\n学科: {subject}\n难度: {difficulty}星\n类型: {question_type}"
        
    except Exception as e:
        return f"❌ 添加题目失败：{str(e)}"


@tool
def search_similar_questions(
    query_text: str,
    subject: str = None,
    difficulty: int = None,
    grade_level: str = None,
    topic: str = None,
    limit: int = 5
) -> str:
    """搜索相似题型（用于推荐练习）
    
    Args:
        query_text: 查询文本（题目内容或问题描述）
        subject: 学科（可选，如数学、英语等）
        difficulty: 难度等级（可选，1-5）
        grade_level: 年级（可选）
        topic: 知识点（可选）
        limit: 返回数量（默认5个）
    
    Returns:
        相似题目列表
    """
    try:
        manager = get_question_bank_manager()
        
        similar_questions = manager.search_similar_questions(
            query_text=query_text,
            subject=subject,
            difficulty=difficulty,
            grade_level=grade_level,
            topic=topic,
            limit=limit
        )
        
        if not similar_questions:
            return f"⚠️ 未找到相似题目\n\n建议：\n1. 尝试调整查询文本\n2. 添加更多题目到题库"
        
        result = f"✅ 找到 {len(similar_questions)} 道相似题目\n\n"
        
        for i, q in enumerate(similar_questions, 1):
            result += f"## 📝 第 {i} 题\n"
            result += f"**学科**: {q['subject']}\n"
            result += f"**难度**: {'⭐' * q['difficulty']}\n"
            result += f"**题型**: {q['question_type']}\n"
            if q['topic']:
                result += f"**知识点**: {q['topic']}\n"
            result += f"**题目**: {q['question_text']}\n"
            if q['options']:
                result += f"**选项**: {json.dumps(q['options'], ensure_ascii=False)}\n"
            result += f"**答案**: {q['correct_answer']}\n"
            if q['explanation']:
                result += f"**解析**: {q['explanation']}\n"
            result += f"**相似度**: {q.get('similarity', 'N/A')}%\n"
            result += f"**题目ID**: {q['id']}\n\n"
        
        return result
        
    except Exception as e:
        return f"❌ 搜索相似题目失败：{str(e)}"


@tool
def answer_with_similar_questions(
    question: str,
    student_id: int = None,
    subject: str = None,
    difficulty: int = None
) -> str:
    """解答问题并提供相似题型（核心功能）
    
    这是智能教育系统的核心功能，流程如下：
    1. 使用LLM解答学生的问题
    2. 从题库中搜索相似题型
    3. 提供详细的解题思路和答案
    4. 推荐相似题型供学生练习巩固
    
    Args:
        question: 学生提出的问题
        student_id: 学生ID（可选）
        subject: 学科（可选，如数学、英语等）
        difficulty: 难度等级（可选，1-5）
    
    Returns:
        解答结果 + 相似题型推荐
    """
    try:
        # Step 1: 使用LLM解答问题
        ctx_llm = new_context(method="llm.invoke")
        llm_client = LLMClient(ctx=ctx_llm)
        
        system_prompt = """你是一位专业的教育AI老师，擅长解答学生的学习问题。
请按照以下格式回答：
1. **答案**：直接给出问题的正确答案
2. **解题思路**：详细说明解题步骤和方法
3. **知识点**：指出本题涉及的知识点
4. **易错点**：提醒学生容易犯错的地方

回答要简洁明了，适合学生学习理解。"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=question)
        ]
        
        response = llm_client.invoke(messages=messages)
        
        # 处理响应内容
        if isinstance(response.content, str):
            answer_text = response.content
        elif isinstance(response.content, list):
            text_parts = [item.get("text", "") for item in response.content if isinstance(item, dict) and item.get("type") == "text"]
            answer_text = " ".join(text_parts)
        else:
            answer_text = str(response.content)
        
        # Step 2: 搜索相似题型
        manager = get_question_bank_manager()
        
        similar_questions = manager.search_similar_questions(
            query_text=question,
            subject=subject,
            difficulty=difficulty,
            limit=3
        )
        
        # Step 3: 组织返回结果
        result = f"# 🎯 问题解答\n\n"
        result += f"## 📖 你的问题\n{question}\n\n"
        result += f"## ✅ 老师的解答\n{answer_text}\n\n"
        
        # Step 4: 推荐相似题型
        if similar_questions:
            result += f"# 📚 相似题型推荐\n\n"
            result += f"为了巩固你对这个知识点的掌握，老师为你推荐以下 **{len(similar_questions)}** 道相似题目：\n\n"
            
            for i, q in enumerate(similar_questions, 1):
                result += f"## 📝 练习 {i}\n"
                result += f"**难度**: {'⭐' * q['difficulty']}\n"
                if q['topic']:
                    result += f"**知识点**: {q['topic']}\n"
                result += f"**题目**: {q['question_text']}\n"
                if q['options']:
                    result += f"**选项**: {json.dumps(q['options'], ensure_ascii=False)}\n"
                result += f"**答案**: {q['correct_answer']}\n"
                if q['explanation']:
                    result += f"**解析**: {q['explanation']}\n"
                result += f"**题目ID**: {q['id']}\n\n"
                # 增加使用次数
                manager.increment_usage_count(q['id'])
            
            result += f"💡 **学习建议**：\n"
            result += f"- 先尝试自己解答这些题目，再对照答案检查\n"
            result += f"- 如果还有疑问，可以随时向老师提问\n"
            result += f"- 通过练习相似题型，加深对知识点的理解\n"
        else:
            result += f"## 📚 相似题型\n\n"
            result += f"⚠️ 暂时未找到相似的练习题目。\n\n"
            result += f"💡 **建议**：\n"
            result += f"- 将这道题收藏起来，下次复习\n"
            result += f"- 尝试自己设计一道类似题目\n"
            result += f"- 向老师索要更多练习题\n"
        
        return result
        
    except Exception as e:
        return f"❌ 解答问题失败：{str(e)}"


@tool
def get_question_by_id(question_id: int) -> str:
    """根据题目ID获取题目详情
    
    Args:
        question_id: 题目ID
    
    Returns:
        题目详情
    """
    try:
        manager = get_question_bank_manager()
        question = manager.get_question_by_id(question_id)
        
        if not question:
            return f"❌ 未找到题目ID: {question_id}"
        
        result = f"# 📝 题目详情\n\n"
        result += f"**题目ID**: {question['id']}\n"
        result += f"**学科**: {question['subject']}\n"
        if question['grade_level']:
            result += f"**年级**: {question['grade_level']}\n"
        result += f"**难度**: {'⭐' * question['difficulty']}\n"
        result += f"**题型**: {question['question_type']}\n"
        if question['topic']:
            result += f"**知识点**: {question['topic']}\n"
        result += f"**题目内容**: {question['question_text']}\n"
        if question['options']:
            result += f"**选项**: {json.dumps(question['options'], ensure_ascii=False)}\n"
        result += f"**正确答案**: {question['correct_answer']}\n"
        if question['explanation']:
            result += f"**题目解析**: {question['explanation']}\n"
        if question['tags']:
            result += f"**标签**: {json.dumps(question['tags'], ensure_ascii=False)}\n"
        result += f"**使用次数**: {question['usage_count']}\n"
        result += f"**创建时间**: {question['created_at']}\n"
        
        return result
        
    except Exception as e:
        return f"❌ 获取题目失败：{str(e)}"


@tool
def get_questions_by_subject(
    subject: str,
    grade_level: str = None,
    difficulty: int = None,
    limit: int = 20
) -> str:
    """根据学科获取题目列表
    
    Args:
        subject: 学科（如数学、英语、物理等）
        grade_level: 年级（可选）
        difficulty: 难度等级（可选，1-5）
        limit: 返回数量（默认20）
    
    Returns:
        题目列表
    """
    try:
        manager = get_question_bank_manager()
        questions = manager.get_questions_by_subject(
            subject=subject,
            grade_level=grade_level,
            difficulty=difficulty,
            limit=limit
        )
        
        if not questions:
            return f"⚠️ 未找到学科为「{subject}」的题目\n\n提示：\n1. 检查学科名称是否正确\n2. 添加更多题目到题库"
        
        result = f"✅ 找到 {len(questions)} 道题目\n\n"
        
        for q in questions:
            result += f"## 题目ID: {q['id']}\n"
            result += f"**难度**: {'⭐' * q['difficulty']}\n"
            result += f"**题型**: {q['question_type']}\n"
            if q['topic']:
                result += f"**知识点**: {q['topic']}\n"
            result += f"**题目**: {q['question_text']}\n"
            result += f"**答案**: {q['correct_answer']}\n\n"
        
        return result
        
    except Exception as e:
        return f"❌ 获取题目列表失败：{str(e)}"
