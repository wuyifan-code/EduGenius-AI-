from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from storage.database.shared.model import LearningRecord, RecordTypeEnum
from datetime import datetime


class LearningRecordCreate(BaseModel):
    """创建学习记录的Pydantic模型"""
    student_id: int = Field(..., description="学生ID")
    plan_id: Optional[int] = Field(None, description="关联计划ID")
    record_type: str = Field(..., description="记录类型: study/homework/test/review")
    subject: str = Field(..., description="学科")
    topic: Optional[str] = Field(None, description="学习主题")
    content: Optional[str] = Field(None, description="学习内容")
    duration_minutes: Optional[int] = Field(None, description="学习时长(分钟)")
    score: Optional[float] = Field(None, description="成绩/分数")
    notes: Optional[str] = Field(None, description="备注")


class LearningRecordUpdate(BaseModel):
    """更新学习记录的Pydantic模型"""
    topic: Optional[str] = None
    content: Optional[str] = None
    duration_minutes: Optional[int] = None
    score: Optional[float] = None
    notes: Optional[str] = None
    ai_feedback: Optional[str] = None


class LearningRecordManager:
    """学习记录管理Manager"""

    def create_learning_record(self, db: Session, record_in: LearningRecordCreate) -> LearningRecord:
        """创建学习记录"""
        record_data = record_in.model_dump()
        # 确保record_type是枚举类型
        if isinstance(record_data['record_type'], str):
            record_data['record_type'] = RecordTypeEnum(record_data['record_type'])
        
        db_record = LearningRecord(**record_data)
        db.add(db_record)
        try:
            db.commit()
            db.refresh(db_record)
            return db_record
        except Exception as e:
            db.rollback()
            raise e

    def get_record_by_id(self, db: Session, record_id: int) -> Optional[LearningRecord]:
        """根据ID获取学习记录"""
        return db.query(LearningRecord).filter(LearningRecord.id == record_id).first()

    def get_records_by_student(self, db: Session, student_id: int, skip: int = 0, limit: int = 100) -> List[LearningRecord]:
        """获取学生的所有学习记录"""
        return db.query(LearningRecord).filter(
            LearningRecord.student_id == student_id
        ).order_by(LearningRecord.created_at.desc()).offset(skip).limit(limit).all()

    def get_records_by_plan(self, db: Session, plan_id: int, skip: int = 0, limit: int = 100) -> List[LearningRecord]:
        """获取学习计划的所有学习记录"""
        return db.query(LearningRecord).filter(
            LearningRecord.plan_id == plan_id
        ).order_by(LearningRecord.created_at.desc()).offset(skip).limit(limit).all()

    def get_records_by_type(self, db: Session, student_id: int, record_type: str, skip: int = 0, limit: int = 100) -> List[LearningRecord]:
        """根据类型获取学习记录"""
        return db.query(LearningRecord).filter(
            LearningRecord.student_id == student_id,
            LearningRecord.record_type == RecordTypeEnum(record_type)
        ).order_by(LearningRecord.created_at.desc()).offset(skip).limit(limit).all()

    def update_learning_record(self, db: Session, record_id: int, record_in: LearningRecordUpdate) -> Optional[LearningRecord]:
        """更新学习记录"""
        db_record = self.get_record_by_id(db, record_id)
        if not db_record:
            return None
        update_data = record_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(db_record, field):
                setattr(db_record, field, value)
        db.add(db_record)
        try:
            db.commit()
            db.refresh(db_record)
            return db_record
        except Exception as e:
            db.rollback()
            raise e

    def add_ai_feedback(self, db: Session, record_id: int, feedback: str) -> Optional[LearningRecord]:
        """添加AI反馈"""
        return self.update_learning_record(db, record_id, LearningRecordUpdate(ai_feedback=feedback))

    def delete_learning_record(self, db: Session, record_id: int) -> bool:
        """删除学习记录"""
        db_record = self.get_record_by_id(db, record_id)
        if not db_record:
            return False
        db.delete(db_record)
        try:
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise e

    def get_student_statistics(self, db: Session, student_id: int) -> dict:
        """获取学生学习统计数据"""
        records = self.get_records_by_student(db, student_id)
        
        total_records = len(records)
        total_duration = sum(r.duration_minutes or 0 for r in records)
        avg_score = None
        scores = [r.score for r in records if r.score is not None]
        if scores:
            avg_score = sum(scores) / len(scores)
        
        type_counts = {}
        for r in records:
            record_type = r.record_type.value if r.record_type else "unknown"
            type_counts[record_type] = type_counts.get(record_type, 0) + 1
        
        return {
            "total_records": total_records,
            "total_duration_minutes": total_duration,
            "average_score": avg_score,
            "type_distribution": type_counts
        }
