from langchain.tools import tool
from coze_coding_dev_sdk.database import get_session
from storage.database.homework_manager import HomeworkManager, HomeworkCreate, HomeworkUpdate


@tool
def create_homework(teacher_id: int, student_id: int, title: str, subject: str, 
                    description: str = None, content: str = None, due_date: str = None) -> str:
    """创建作业
    
    Args:
        teacher_id: 教师ID
        student_id: 学生ID
        title: 作业标题
        subject: 学科
        description: 作业描述（可选）
        content: 作业内容（可选）
        due_date: 截止日期（可选）
    
    Returns:
        创建的作业信息
    """
    db = get_session()
    try:
        mgr = HomeworkManager()
        homework = mgr.create_homework(db, HomeworkCreate(
            teacher_id=teacher_id,
            student_id=student_id,
            title=title,
            subject=subject,
            description=description,
            content=content,
            due_date=due_date
        ))
        return f"✅ 作业创建成功！\n作业ID: {homework.id}\n标题: {homework.title}\n学科: {homework.subject}\n截止日期: {homework.due_date or '无'}\n状态: {homework.status.value}"
    except Exception as e:
        return f"❌ 创建作业失败: {str(e)}"
    finally:
        db.close()


@tool
def submit_homework(homework_id: int, submission_content: str) -> str:
    """学生提交作业
    
    Args:
        homework_id: 作业ID
        submission_content: 提交内容
    
    Returns:
        提交结果
    """
    db = get_session()
    try:
        mgr = HomeworkManager()
        homework = mgr.update_homework(db, homework_id, HomeworkUpdate(
            status="submitted",
            submission_content=submission_content
        ))
        if not homework:
            return f"❌ 未找到ID为 {homework_id} 的作业"
        return f"✅ 作业提交成功！\n作业ID: {homework.id}\n提交时间: {homework.updated_at}"
    except Exception as e:
        return f"❌ 提交失败: {str(e)}"
    finally:
        db.close()


@tool
def grade_homework(homework_id: int, score: float, ai_feedback: str) -> str:
    """AI批改作业
    
    Args:
        homework_id: 作业ID
        score: 得分
        ai_feedback: AI反馈内容
    
    Returns:
        批改结果
    """
    db = get_session()
    try:
        mgr = HomeworkManager()
        homework = mgr.update_homework(db, homework_id, HomeworkUpdate(
            status="graded",
            score=score,
            ai_feedback=ai_feedback
        ))
        if not homework:
            return f"❌ 未找到ID为 {homework_id} 的作业"
        return f"✅ 作业批改完成！\n作业ID: {homework.id}\n得分: {homework.score}\nAI反馈: {homework.ai_feedback}"
    except Exception as e:
        return f"❌ 批改失败: {str(e)}"
    finally:
        db.close()


@tool
def get_student_homeworks(student_id: int, limit: int = 10) -> str:
    """获取学生的所有作业
    
    Args:
        student_id: 学生ID
        limit: 返回数量限制，默认10
    
    Returns:
        作业列表
    """
    db = get_session()
    try:
        mgr = HomeworkManager()
        homeworks = mgr.get_homeworks_by_student(db, student_id, limit=limit)
        if not homeworks:
            return f"📋 学生 {student_id} 暂无作业"
        
        result = f"📋 学生 {student_id} 的作业（共{len(homeworks)}个）:\n\n"
        for i, hw in enumerate(homeworks, 1):
            result += f"{i}. {hw.title} (ID: {hw.id})\n"
            result += f"   学科: {hw.subject}\n"
            result += f"   状态: {hw.status.value}\n"
            if hw.score:
                result += f"   得分: {hw.score}\n"
            if hw.due_date:
                result += f"   截止日期: {hw.due_date.strftime('%Y-%m-%d %H:%M')}\n"
            result += "\n"
        return result
    except Exception as e:
        return f"❌ 查询失败: {str(e)}"
    finally:
        db.close()
