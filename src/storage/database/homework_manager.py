from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from storage.database.shared.model import Homework, HomeworkStatusEnum
from datetime import datetime
from coze_coding_dev_sdk.database import get_session


class HomeworkCreate(BaseModel):
    """创建作业的Pydantic模型"""
    teacher_id: int = Field(..., description="教师ID")
    student_id: int = Field(..., description="学生ID")
    title: str = Field(..., description="作业标题")
    subject: str = Field(..., description="学科")
    description: Optional[str] = Field(None, description="作业描述")
    content: Optional[str] = Field(None, description="作业内容")
    due_date: Optional[str] = Field(None, description="截止日期")


class HomeworkUpdate(BaseModel):
    """更新作业的Pydantic模型"""
    status: Optional[str] = None
    score: Optional[float] = None
    ai_feedback: Optional[str] = None
    submission_content: Optional[str] = None


class HomeworkManager:
    """作业管理Manager"""

    def create_homework(self, db: Session, homework_in: HomeworkCreate) -> Homework:
        """创建作业"""
        homework_data = homework_in.model_dump()
        if homework_data.get('due_date'):
            homework_data['due_date'] = datetime.fromisoformat(homework_data['due_date'])
        db_homework = Homework(**homework_data)
        db.add(db_homework)
        try:
            db.commit()
            db.refresh(db_homework)
            return db_homework
        except Exception as e:
            db.rollback()
            raise e

    def get_homework_by_id(self, db: Session, homework_id: int) -> Optional[Homework]:
        """根据ID获取作业"""
        return db.query(Homework).filter(Homework.id == homework_id).first()

    def get_homeworks_by_student(self, db: Session, student_id: int, skip: int = 0, limit: int = 100) -> List[Homework]:
        """获取学生的所有作业"""
        return db.query(Homework).filter(
            Homework.student_id == student_id
        ).offset(skip).limit(limit).all()

    def get_homeworks_by_teacher(self, db: Session, teacher_id: int, skip: int = 0, limit: int = 100) -> List[Homework]:
        """获取教师的所有作业"""
        return db.query(Homework).filter(
            Homework.teacher_id == teacher_id
        ).offset(skip).limit(limit).all()

    def update_homework(self, db: Session, homework_id: int, homework_in: HomeworkUpdate) -> Optional[Homework]:
        """更新作业"""
        db_homework = self.get_homework_by_id(db, homework_id)
        if not db_homework:
            return None
        update_data = homework_in.model_dump(exclude_unset=True)
        if 'status' in update_data:
            update_data['status'] = HomeworkStatusEnum(update_data['status'])
        for field, value in update_data.items():
            if hasattr(db_homework, field):
                setattr(db_homework, field, value)
        db.add(db_homework)
        try:
            db.commit()
            db.refresh(db_homework)
            return db_homework
        except Exception as e:
            db.rollback()
            raise e
