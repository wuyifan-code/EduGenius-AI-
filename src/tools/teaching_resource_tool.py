from langchain.tools import tool
from coze_coding_dev_sdk.database import get_session
from storage.database.teaching_resource_manager import TeachingResourceManager, TeachingResourceCreate


@tool
def create_teaching_resource(teacher_id: int, title: str, resource_type: str, 
                             subject: str, grade_level: str = None, 
                             content: str = None) -> str:
    """创建教学资源
    
    Args:
        teacher_id: 教师ID
        title: 资源标题
        resource_type: 资源类型 (lesson_plan/exercise/courseware/material)
        subject: 学科
        grade_level: 适用年级（可选）
        content: 资源内容（可选）
    
    Returns:
        创建的教学资源信息
    """
    db = get_session()
    try:
        mgr = TeachingResourceManager()
        resource = mgr.create_teaching_resource(db, TeachingResourceCreate(
            teacher_id=teacher_id,
            title=title,
            resource_type=resource_type,
            subject=subject,
            grade_level=grade_level,
            content=content,
            ai_generated=True  # 标记为AI生成
        ))
        return f"✅ 教学资源创建成功！\n资源ID: {resource.id}\n标题: {resource.title}\n类型: {resource.resource_type}\n学科: {resource.subject}\n年级: {resource.grade_level or '未设置'}\nAI生成: 是"
    except Exception as e:
        return f"❌ 创建教学资源失败: {str(e)}"
    finally:
        db.close()


@tool
def get_teacher_resources(teacher_id: int, limit: int = 10) -> str:
    """获取某个教师的所有教学资源
    
    Args:
        teacher_id: 教师ID
        limit: 返回数量限制，默认10
    
    Returns:
        教学资源列表
    """
    db = get_session()
    try:
        mgr = TeachingResourceManager()
        resources = mgr.get_resources_by_teacher(db, teacher_id, limit=limit)
        if not resources:
            return f"📋 教师 {teacher_id} 暂无教学资源"
        
        result = f"📋 教师 {teacher_id} 的教学资源（共{len(resources)}个）:\n\n"
        for i, resource in enumerate(resources, 1):
            result += f"{i}. {resource.title} (ID: {resource.id})\n"
            result += f"   类型: {resource.resource_type}\n"
            result += f"   学科: {resource.subject}\n"
            if resource.grade_level:
                result += f"   年级: {resource.grade_level}\n"
            result += f"   AI生成: {'是' if resource.ai_generated else '否'}\n"
            result += f"   创建时间: {resource.created_at.strftime('%Y-%m-%d')}\n\n"
        return result
    except Exception as e:
        return f"❌ 查询失败: {str(e)}"
    finally:
        db.close()


@tool
def get_resources_by_subject(subject: str, limit: int = 5) -> str:
    """根据学科获取教学资源
    
    Args:
        subject: 学科名称
        limit: 返回数量限制，默认5
    
    Returns:
        教学资源列表
    """
    db = get_session()
    try:
        mgr = TeachingResourceManager()
        resources = mgr.get_resources_by_subject(db, subject, limit=limit)
        if not resources:
            return f"📋 学科 '{subject}' 暂无教学资源"
        
        result = f"📋 学科 '{subject}' 的教学资源（共{len(resources)}个）:\n\n"
        for i, resource in enumerate(resources, 1):
            result += f"{i}. {resource.title} (ID: {resource.id})\n"
            result += f"   类型: {resource.resource_type}\n"
            result += f"   年级: {resource.grade_level or '未设置'}\n"
            result += f"   教师ID: {resource.teacher_id}\n\n"
        return result
    except Exception as e:
        return f"❌ 查询失败: {str(e)}"
    finally:
        db.close()
