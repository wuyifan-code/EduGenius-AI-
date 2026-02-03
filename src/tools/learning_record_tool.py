from langchain.tools import tool
from coze_coding_dev_sdk.database import get_session
from storage.database.learning_record_manager import LearningRecordManager, LearningRecordCreate


@tool
def add_learning_record(student_id: int, subject: str, record_type: str, 
                        topic: str = None, content: str = None, 
                        duration_minutes: int = None, score: float = None, 
                        notes: str = None) -> str:
    """添加学习记录
    
    Args:
        student_id: 学生ID
        subject: 学科
        record_type: 记录类型 (study/homework/test/review)
        topic: 学习主题（可选）
        content: 学习内容（可选）
        duration_minutes: 学习时长（分钟）（可选）
        score: 成绩/分数（可选）
        notes: 备注（可选）
    
    Returns:
        添加的学习记录信息
    """
    db = get_session()
    try:
        mgr = LearningRecordManager()
        record = mgr.create_learning_record(db, LearningRecordCreate(
            student_id=student_id,
            record_type=record_type,
            subject=subject,
            topic=topic,
            content=content,
            duration_minutes=duration_minutes,
            score=score,
            notes=notes
        ))
        return f"✅ 学习记录添加成功！\n记录ID: {record.id}\n学科: {record.subject}\n类型: {record.record_type.value}\n主题: {record.topic or '无'}\n时长: {record.duration_minutes or 0}分钟\n成绩: {record.score or '无'}"
    except Exception as e:
        return f"❌ 添加学习记录失败: {str(e)}"
    finally:
        db.close()


@tool
def get_student_records(student_id: int, limit: int = 10) -> str:
    """获取某个学生的学习记录
    
    Args:
        student_id: 学生ID
        limit: 返回数量限制，默认10
    
    Returns:
        学习记录列表
    """
    db = get_session()
    try:
        mgr = LearningRecordManager()
        records = mgr.get_records_by_student(db, student_id, limit=limit)
        if not records:
            return f"📋 学生 {student_id} 暂无学习记录"
        
        result = f"📋 学生 {student_id} 的学习记录（共{len(records)}条）:\n\n"
        for i, record in enumerate(records, 1):
            result += f"{i}. [{record.record_type.value}] {record.subject} - {record.topic or '无主题'}\n"
            result += f"   时间: {record.created_at.strftime('%Y-%m-%d %H:%M')}\n"
            if record.duration_minutes:
                result += f"   时长: {record.duration_minutes}分钟\n"
            if record.score:
                result += f"   成绩: {record.score}\n"
            if record.ai_feedback:
                result += f"   AI反馈: {record.ai_feedback}\n"
            result += "\n"
        return result
    except Exception as e:
        return f"❌ 查询失败: {str(e)}"
    finally:
        db.close()


@tool
def get_student_statistics(student_id: int) -> str:
    """获取学生的学习统计数据
    
    Args:
        student_id: 学生ID
    
    Returns:
        学习统计信息
    """
    db = get_session()
    try:
        mgr = LearningRecordManager()
        stats = mgr.get_student_statistics(db, student_id)
        
        result = f"📊 学生 {student_id} 的学习统计：\n\n"
        result += f"总学习记录数: {stats['total_records']} 条\n"
        result += f"总学习时长: {stats['total_duration_minutes']} 分钟\n"
        if stats['average_score']:
            result += f"平均成绩: {stats['average_score']:.2f}\n"
        else:
            result += f"平均成绩: 暂无成绩记录\n"
        
        result += f"\n学习类型分布:\n"
        for record_type, count in stats['type_distribution'].items():
            result += f"  - {record_type}: {count} 次\n"
        
        return result
    except Exception as e:
        return f"❌ 查询失败: {str(e)}"
    finally:
        db.close()


@tool
def add_ai_feedback(record_id: int, feedback: str) -> str:
    """为学习记录添加AI反馈
    
    Args:
        record_id: 记录ID
        feedback: AI反馈内容
    
    Returns:
        更新结果
    """
    db = get_session()
    try:
        mgr = LearningRecordManager()
        record = mgr.add_ai_feedback(db, record_id, feedback)
        if not record:
            return f"❌ 未找到ID为 {record_id} 的学习记录"
        return f"✅ AI反馈添加成功！\n记录ID: {record.id}\nAI反馈: {record.ai_feedback}"
    except Exception as e:
        return f"❌ 添加反馈失败: {str(e)}"
    finally:
        db.close()
