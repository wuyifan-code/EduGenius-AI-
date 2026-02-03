from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from storage.database.shared.model import LearningReport, ReportTypeEnum
from datetime import datetime


class LearningReportCreate(BaseModel):
    """创建学习报告的Pydantic模型"""
    student_id: int = Field(..., description="学生ID")
    report_type: str = Field(..., description="报告类型")
    title: str = Field(..., description="报告标题")
    content: str = Field(..., description="报告内容")
    summary: Optional[str] = Field(None, description="报告摘要")
    statistics: Optional[dict] = Field(None, description="统计数据")
    ai_suggestions: Optional[str] = Field(None, description="AI建议")
    report_date: Optional[str] = Field(None, description="报告日期")


class LearningReportManager:
    """学习报告管理Manager"""

    def create_report(self, db: Session, report_in: LearningReportCreate) -> LearningReport:
        """创建学习报告"""
        report_data = report_in.model_dump()
        report_data['report_type'] = ReportTypeEnum(report_data['report_type'])
        if report_data.get('report_date'):
            report_data['report_date'] = datetime.fromisoformat(report_data['report_date'])
        db_report = LearningReport(**report_data)
        db.add(db_report)
        try:
            db.commit()
            db.refresh(db_report)
            return db_report
        except Exception as e:
            db.rollback()
            raise e

    def get_report_by_id(self, db: Session, report_id: int) -> Optional[LearningReport]:
        """根据ID获取报告"""
        return db.query(LearningReport).filter(LearningReport.id == report_id).first()

    def get_reports_by_student(self, db: Session, student_id: int, skip: int = 0, limit: int = 100) -> List[LearningReport]:
        """获取学生的所有报告"""
        return db.query(LearningReport).filter(
            LearningReport.student_id == student_id
        ).order_by(LearningReport.created_at.desc()).offset(skip).limit(limit).all()

    def get_reports_by_type(self, db: Session, report_type: str, student_id: int, skip: int = 0, limit: int = 100) -> List[LearningReport]:
        """根据类型获取报告"""
        return db.query(LearningReport).filter(
            LearningReport.student_id == student_id,
            LearningReport.report_type == ReportTypeEnum(report_type)
        ).order_by(LearningReport.created_at.desc()).offset(skip).limit(limit).all()
