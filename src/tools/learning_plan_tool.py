from langchain.tools import tool
from coze_coding_dev_sdk.database import get_session
from storage.database.learning_plan_manager import LearningPlanManager, LearningPlanCreate, LearningPlanUpdate


@tool
def create_learning_plan(student_id: int, title: str, subject: str, description: str = None, 
                         target_goals: str = None, schedule: str = None) -> str:
    """为某个学生创建学习计划
    
    Args:
        student_id: 学生ID
        title: 计划标题
        subject: 学科
        description: 计划描述（可选）
        target_goals: 学习目标（可选）
        schedule: 学习安排，JSON格式的日程表（可选）
    
    Returns:
        创建的学习计划信息
    """
    db = get_session()
    try:
        mgr = LearningPlanManager()
        plan = mgr.create_learning_plan(db, LearningPlanCreate(
            student_id=student_id,
            title=title,
            subject=subject,
            description=description,
            target_goals=target_goals,
            schedule={"schedule": schedule} if schedule else None
        ))
        return f"✅ 学习计划创建成功！\n计划ID: {plan.id}\n标题: {plan.title}\n学科: {plan.subject}\n目标: {plan.target_goals or '未设置'}\n状态: {plan.status.value}"
    except Exception as e:
        return f"❌ 创建学习计划失败: {str(e)}"
    finally:
        db.close()


@tool
def get_student_plans(student_id: int, limit: int = 5) -> str:
    """获取某个学生的所有学习计划
    
    Args:
        student_id: 学生ID
        limit: 返回数量限制，默认5
    
    Returns:
        学习计划列表
    """
    db = get_session()
    try:
        mgr = LearningPlanManager()
        plans = mgr.get_plans_by_student(db, student_id, limit=limit)
        if not plans:
            return f"📋 学生 {student_id} 暂无学习计划"
        
        result = f"📋 学生 {student_id} 的学习计划（共{len(plans)}个）:\n\n"
        for i, plan in enumerate(plans, 1):
            result += f"{i}. {plan.title} (ID: {plan.id})\n   学科: {plan.subject}\n   状态: {plan.status.value}\n   进度: {plan.progress}%\n"
            if plan.target_goals:
                result += f"   目标: {plan.target_goals}\n"
            result += "\n"
        return result
    except Exception as e:
        return f"❌ 查询失败: {str(e)}"
    finally:
        db.close()


@tool
def update_plan_progress(plan_id: int, progress: float, ai_suggestions: str = None) -> str:
    """更新学习计划的进度
    
    Args:
        plan_id: 计划ID
        progress: 进度值（0-100）
        ai_suggestions: AI建议（可选）
    
    Returns:
        更新结果
    """
    db = get_session()
    try:
        mgr = LearningPlanManager()
        plan = mgr.update_plan_progress(db, plan_id, progress, ai_suggestions)
        if not plan:
            return f"❌ 未找到ID为 {plan_id} 的学习计划"
        return f"✅ 学习计划进度更新成功！\n计划ID: {plan.id}\n进度: {plan.progress}%\nAI建议: {plan.ai_suggestions or '无'}"
    except Exception as e:
        return f"❌ 更新失败: {str(e)}"
    finally:
        db.close()


@tool
def get_plan_details(plan_id: int) -> str:
    """获取学习计划的详细信息
    
    Args:
        plan_id: 计划ID
    
    Returns:
        计划详细信息
    """
    db = get_session()
    try:
        mgr = LearningPlanManager()
        plan = mgr.get_plan_by_id(db, plan_id)
        if not plan:
            return f"❌ 未找到ID为 {plan_id} 的学习计划"
        
        result = f"📚 学习计划详情：\n"
        result += f"ID: {plan.id}\n"
        result += f"标题: {plan.title}\n"
        result += f"学科: {plan.subject}\n"
        result += f"描述: {plan.description or '无'}\n"
        result += f"学习目标: {plan.target_goals or '无'}\n"
        result += f"状态: {plan.status.value}\n"
        result += f"进度: {plan.progress}%\n"
        if plan.ai_suggestions:
            result += f"AI建议: {plan.ai_suggestions}\n"
        if plan.start_date:
            result += f"开始日期: {plan.start_date.strftime('%Y-%m-%d')}\n"
        if plan.end_date:
            result += f"结束日期: {plan.end_date.strftime('%Y-%m-%d')}\n"
        return result
    except Exception as e:
        return f"❌ 查询失败: {str(e)}"
    finally:
        db.close()
