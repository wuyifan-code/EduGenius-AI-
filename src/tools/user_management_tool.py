from langchain.tools import tool, ToolRuntime
from coze_coding_utils.runtime_ctx.context import new_context
from coze_coding_dev_sdk.database import get_session
from storage.database.user_manager import UserManager, UserCreate, UserUpdate


@tool
def create_student(name: str, grade_level: str = None, subject: str = None, email: str = None, phone: str = None) -> str:
    """创建一个学生账号
    
    Args:
        name: 学生姓名
        grade_level: 年级/级别
        subject: 专长学科（可选）
        email: 邮箱（可选）
        phone: 手机号（可选）
    
    Returns:
        创建的学生信息
    """
    db = get_session()
    try:
        mgr = UserManager()
        student = mgr.create_user(db, UserCreate(
            name=name,
            email=email,
            phone=phone,
            role="student",
            grade_level=grade_level,
            subject=subject
        ))
        return f"✅ 学生创建成功！\n学生ID: {student.id}\n姓名: {student.name}\n年级: {student.grade_level or '未设置'}\n学科: {student.subject or '未设置'}"
    except Exception as e:
        return f"❌ 创建学生失败: {str(e)}"
    finally:
        db.close()


@tool
def create_teacher(name: str, subject: str, grade_level: str = None, email: str = None, phone: str = None) -> str:
    """创建一个教师账号
    
    Args:
        name: 教师姓名
        subject: 专长学科
        grade_level: 教授年级（可选）
        email: 邮箱（可选）
        phone: 手机号（可选）
    
    Returns:
        创建的教师信息
    """
    db = get_session()
    try:
        mgr = UserManager()
        teacher = mgr.create_user(db, UserCreate(
            name=name,
            email=email,
            phone=phone,
            role="teacher",
            grade_level=grade_level,
            subject=subject
        ))
        return f"✅ 教师创建成功！\n教师ID: {teacher.id}\n姓名: {teacher.name}\n学科: {teacher.subject}\n年级: {teacher.grade_level or '未设置'}"
    except Exception as e:
        return f"❌ 创建教师失败: {str(e)}"
    finally:
        db.close()


@tool
def get_student_info(student_id: int) -> str:
    """查询学生信息
    
    Args:
        student_id: 学生ID
    
    Returns:
        学生详细信息
    """
    db = get_session()
    try:
        mgr = UserManager()
        student = mgr.get_user_by_id(db, student_id)
        if not student:
            return f"❌ 未找到ID为 {student_id} 的学生"
        return f"📚 学生信息：\nID: {student.id}\n姓名: {student.name}\n年级: {student.grade_level or '未设置'}\n学科: {student.subject or '未设置'}\n邮箱: {student.email or '未设置'}\n手机: {student.phone or '未设置'}\n状态: {'活跃' if student.is_active else '非活跃'}"
    except Exception as e:
        return f"❌ 查询失败: {str(e)}"
    finally:
        db.close()


@tool
def list_students(limit: int = 10) -> str:
    """列出所有学生
    
    Args:
        limit: 返回数量限制，默认10
    
    Returns:
        学生列表
    """
    db = get_session()
    try:
        mgr = UserManager()
        students = mgr.get_students(db, limit=limit)
        if not students:
            return "📋 暂无学生"
        
        result = f"📋 学生列表（共{len(students)}人）:\n\n"
        for i, student in enumerate(students, 1):
            result += f"{i}. {student.name} (ID: {student.id}) - {student.grade_level or '未设置年级'} - {student.subject or '未设置学科'}\n"
        return result
    except Exception as e:
        return f"❌ 查询失败: {str(e)}"
    finally:
        db.close()
