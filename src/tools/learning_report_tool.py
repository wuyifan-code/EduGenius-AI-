from langchain.tools import tool
from coze_coding_dev_sdk.database import get_session
from storage.database.learning_report_manager import LearningReportManager, LearningReportCreate
from storage.database.learning_record_manager import LearningRecordManager


@tool
def generate_learning_report(student_id: int, report_type: str, title: str, 
                              summary: str, statistics: dict, ai_suggestions: str) -> str:
    """生成学习报告
    
    Args:
        student_id: 学生ID
        report_type: 报告类型（daily/weekly/monthly/progress/assessment）
        title: 报告标题
        summary: 报告摘要
        statistics: 统计数据（JSON格式）
        ai_suggestions: AI建议
    
    Returns:
        生成的报告信息
    """
    db = get_session()
    try:
        # 构建完整报告内容
        content = f"# {title}\n\n"
        content += f"## 报告摘要\n{summary}\n\n"
        
        if statistics:
            content += f"## 学习统计\n"
            for key, value in statistics.items():
                content += f"- {key}: {value}\n"
            content += "\n"
        
        if ai_suggestions:
            content += f"## AI建议\n{ai_suggestions}\n"
        
        mgr = LearningReportManager()
        report = mgr.create_report(db, LearningReportCreate(
            student_id=student_id,
            report_type=report_type,
            title=title,
            content=content,
            summary=summary,
            statistics=statistics,
            ai_suggestions=ai_suggestions
        ))
        return f"✅ 学习报告生成成功！\n报告ID: {report.id}\n标题: {report.title}\n类型: {report.report_type.value}\n创建时间: {report.created_at.strftime('%Y-%m-%d %H:%M')}"
    except Exception as e:
        return f"❌ 生成报告失败: {str(e)}"
    finally:
        db.close()


@tool
def get_student_reports(student_id: int, report_type: str = None, limit: int = 10) -> str:
    """获取学生的学习报告
    
    Args:
        student_id: 学生ID
        report_type: 报告类型（可选）
        limit: 返回数量限制，默认10
    
    Returns:
        报告列表
    """
    db = get_session()
    try:
        mgr = LearningReportManager()
        if report_type:
            reports = mgr.get_reports_by_type(db, report_type, student_id, limit=limit)
        else:
            reports = mgr.get_reports_by_student(db, student_id, limit=limit)
        
        if not reports:
            return f"📋 学生 {student_id} 暂无学习报告"
        
        result = f"📋 学生 {student_id} 的学习报告（共{len(reports)}份）:\n\n"
        for i, report in enumerate(reports, 1):
            result += f"{i}. {report.title} (ID: {report.id})\n"
            result += f"   类型: {report.report_type.value}\n"
            if report.summary:
                result += f"   摘要: {report.summary[:100]}...\n"
            result += f"   创建时间: {report.created_at.strftime('%Y-%m-%d %H:%M')}\n\n"
        return result
    except Exception as e:
        return f"❌ 查询失败: {str(e)}"
    finally:
        db.close()


@tool
def generate_trend_report(student_id: int) -> str:
    """生成学习趋势报告
    
    Args:
        student_id: 学生ID
    
    Returns:
        学习趋势分析
    """
    db = get_session()
    try:
        record_mgr = LearningRecordManager()
        stats = record_mgr.get_student_statistics(db, student_id)
        records = record_mgr.get_records_by_student(db, student_id, limit=100)
        
        # 分析趋势
        if not records:
            return f"❌ 学生 {student_id} 暂无学习记录，无法生成趋势报告"
        
        # 计算最近7天的学习情况
        from datetime import datetime, timedelta
        now = datetime.now()
        recent_records = [r for r in records if (now - r.created_at).days <= 7]
        recent_duration = sum(r.duration_minutes or 0 for r in recent_records)
        
        # 计算成绩趋势
        scores = [r.score for r in records if r.score is not None]
        if len(scores) >= 2:
            recent_avg = sum(scores[-5:]) / min(5, len(scores))
            early_avg = sum(scores[:5]) / min(5, len(scores))
            trend = "上升" if recent_avg > early_avg else "下降"
        else:
            trend = "稳定"
        
        report = f"📊 学习趋势报告（学生ID: {student_id}）\n\n"
        report += f"## 总体情况\n"
        report += f"- 总学习记录: {stats['total_records']} 条\n"
        report += f"- 总学习时长: {stats['total_duration_minutes']} 分钟\n"
        report += f"- 平均成绩: {stats['average_score']:.2f}\n\n"
        
        report += f"## 最近7天\n"
        report += f"- 学习记录: {len(recent_records)} 条\n"
        report += f"- 学习时长: {recent_duration} 分钟\n\n"
        
        report += f"## 成绩趋势\n"
        report += f"- 趋势: {trend}\n"
        if scores:
            report += f"- 最好成绩: {max(scores)}\n"
            report += f"- 最差成绩: {min(scores)}\n"
        
        return report
    except Exception as e:
        return f"❌ 生成趋势报告失败: {str(e)}"
    finally:
        db.close()
