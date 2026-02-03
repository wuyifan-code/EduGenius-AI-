from langchain.tools import tool
from coze_coding_dev_sdk.database import get_session
from storage.database.online_test_manager import OnlineTestManager, TestQuestionManager, StudentAnswerManager, OnlineTestCreate, OnlineTestUpdate, TestQuestionCreate, StudentAnswerCreate


@tool
def create_online_test(teacher_id: int, title: str, subject: str, duration_minutes: int, total_score: float,
                       grade_level: str = None, description: str = None) -> str:
    """创建在线测试
    
    Args:
        teacher_id: 教师ID
        title: 测试标题
        subject: 学科
        duration_minutes: 测试时长（分钟）
        total_score: 总分
        grade_level: 适用年级（可选）
        description: 测试描述（可选）
    
    Returns:
        创建的测试信息
    """
    db = get_session()
    try:
        mgr = OnlineTestManager()
        test = mgr.create_test(db, OnlineTestCreate(
            teacher_id=teacher_id,
            title=title,
            subject=subject,
            grade_level=grade_level,
            description=description,
            duration_minutes=duration_minutes,
            total_score=total_score
        ))
        return f"✅ 测试创建成功！\n测试ID: {test.id}\n标题: {test.title}\n学科: {test.subject}\n时长: {test.duration_minutes}分钟\n总分: {test.total_score}\n状态: {test.status.value}"
    except Exception as e:
        return f"❌ 创建测试失败: {str(e)}"
    finally:
        db.close()


@tool
def add_test_question(test_id: int, question_text: str, question_type: str, points: float, order: int,
                      options: dict = None, correct_answer: str = None, explanation: str = None) -> str:
    """添加测试题目
    
    Args:
        test_id: 测试ID
        question_text: 题目内容
        question_type: 题目类型（single_choice/multiple_choice/true_false/fill_blank/short_answer/essay）
        points: 分值
        order: 题目顺序
        options: 选项（可选，选择题使用）
        correct_answer: 正确答案（可选）
        explanation: 题目解析（可选）
    
    Returns:
        添加的题目信息
    """
    db = get_session()
    try:
        mgr = TestQuestionManager()
        question = mgr.create_question(db, TestQuestionCreate(
            test_id=test_id,
            question_text=question_text,
            question_type=question_type,
            options=options,
            correct_answer=correct_answer,
            points=points,
            order=order,
            explanation=explanation
        ))
        return f"✅ 题目添加成功！\n题目ID: {question.id}\n测试ID: {test_id}\n题目类型: {question.question_type.value}\n分值: {question.points}"
    except Exception as e:
        return f"❌ 添加题目失败: {str(e)}"
    finally:
        db.close()


@tool
def submit_answer(test_id: int, question_id: int, student_id: int, answer_content: str, 
                  time_spent_seconds: int, is_correct: bool = None, score: float = 0) -> str:
    """提交学生答案
    
    Args:
        test_id: 测试ID
        question_id: 题目ID
        student_id: 学生ID
        answer_content: 答案内容
        time_spent_seconds: 答题用时（秒）
        is_correct: 是否正确（可选）
        score: 得分（可选）
    
    Returns:
        提交结果
    """
    db = get_session()
    try:
        mgr = StudentAnswerManager()
        answer = mgr.create_answer(db, StudentAnswerCreate(
            test_id=test_id,
            question_id=question_id,
            student_id=student_id,
            answer_content=answer_content,
            time_spent_seconds=time_spent_seconds
        ))
        # 更新分数和正确性
        if is_correct is not None:
            answer.is_correct = is_correct
        if score > 0:
            answer.score = score
        db.commit()
        return f"✅ 答案提交成功！\n答题记录ID: {answer.id}\n正确: {'是' if answer.is_correct else '否'}\n得分: {answer.score}"
    except Exception as e:
        return f"❌ 提交失败: {str(e)}"
    finally:
        db.close()


@tool
def get_test_results(test_id: int, student_id: int) -> str:
    """获取学生的测试结果
    
    Args:
        test_id: 测试ID
        student_id: 学生ID
    
    Returns:
        测试结果
    """
    db = get_session()
    try:
        answer_mgr = StudentAnswerManager()
        answers = answer_mgr.get_answers_by_test_and_student(db, test_id, student_id)
        
        if not answers:
            return f"📋 学生 {student_id} 在测试 {test_id} 中暂无答题记录"
        
        total_score = sum(a.score for a in answers)
        correct_count = sum(1 for a in answers if a.is_correct)
        total_time = sum(a.time_spent_seconds for a in answers)
        
        result = f"📊 测试结果：\n"
        result += f"测试ID: {test_id}\n"
        result += f"学生ID: {student_id}\n"
        result += f"总得分: {total_score}\n"
        result += f"正确题数: {correct_count}/{len(answers)}\n"
        result += f"正确率: {correct_count/len(answers)*100:.1f}%\n"
        result += f"总用时: {total_time}秒 ({total_time/60:.1f}分钟)\n\n"
        result += f"详细答题记录:\n"
        
        for i, ans in enumerate(answers, 1):
            result += f"\n{i}. 题目ID: {ans.question_id}\n"
            result += f"   学生答案: {ans.answer_content}\n"
            result += f"   正确性: {'✓' if ans.is_correct else '✗'}\n"
            result += f"   得分: {ans.score}\n"
            result += f"   用时: {ans.time_spent_seconds}秒\n"
            if ans.ai_feedback:
                result += f"   AI反馈: {ans.ai_feedback}\n"
        
        return result
    except Exception as e:
        return f"❌ 查询失败: {str(e)}"
    finally:
        db.close()
