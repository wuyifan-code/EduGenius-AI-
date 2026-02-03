from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from storage.database.shared.model import LearningPlan, PlanStatusEnum
from datetime import datetime


class LearningPlanCreate(BaseModel):
    """创建学习计划的Pydantic模型"""
    student_id: int = Field(..., description="学生ID")
    title: str = Field(..., description="计划标题")
    description: Optional[str] = Field(None, description="计划描述")
    subject: str = Field(..., description="学科")
    target_goals: Optional[str] = Field(None, description="学习目标")
    schedule: Optional[dict] = Field(None, description="学习安排(日程表)")
    start_date: Optional[str] = Field(None, description="开始日期")
    end_date: Optional[str] = Field(None, description="结束日期")


class LearningPlanUpdate(BaseModel):
    """更新学习计划的Pydantic模型"""
    title: Optional[str] = None
    description: Optional[str] = None
    target_goals: Optional[str] = None
    schedule: Optional[dict] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    progress: Optional[float] = None
    ai_suggestions: Optional[str] = None


class LearningPlanManager:
    """学习计划管理Manager"""

    def create_learning_plan(self, db: Session, plan_in: LearningPlanCreate) -> LearningPlan:
        """创建学习计划"""
        plan_data = plan_in.model_dump()
        
        # 处理日期字符串转datetime
        if plan_data.get('start_date'):
            plan_data['start_date'] = datetime.fromisoformat(plan_data['start_date'])
        if plan_data.get('end_date'):
            plan_data['end_date'] = datetime.fromisoformat(plan_data['end_date'])
        
        db_plan = LearningPlan(**plan_data)
        db.add(db_plan)
        try:
            db.commit()
            db.refresh(db_plan)
            return db_plan
        except Exception as e:
            db.rollback()
            raise e

    def get_plan_by_id(self, db: Session, plan_id: int) -> Optional[LearningPlan]:
        """根据ID获取学习计划"""
        return db.query(LearningPlan).filter(LearningPlan.id == plan_id).first()

    def get_plans_by_student(self, db: Session, student_id: int, skip: int = 0, limit: int = 100) -> List[LearningPlan]:
        """获取学生的所有学习计划"""
        return db.query(LearningPlan).filter(
            LearningPlan.student_id == student_id
        ).offset(skip).limit(limit).all()

    def get_plans_by_status(self, db: Session, status: str, skip: int = 0, limit: int = 100) -> List[LearningPlan]:
        """根据状态获取学习计划"""
        return db.query(LearningPlan).filter(
            LearningPlan.status == PlanStatusEnum(status)
        ).offset(skip).limit(limit).all()

    def update_learning_plan(self, db: Session, plan_id: int, plan_in: LearningPlanUpdate) -> Optional[LearningPlan]:
        """更新学习计划"""
        db_plan = self.get_plan_by_id(db, plan_id)
        if not db_plan:
            return None
        
        update_data = plan_in.model_dump(exclude_unset=True)
        
        # 处理日期字符串转datetime
        if 'start_date' in update_data and update_data['start_date']:
            update_data['start_date'] = datetime.fromisoformat(update_data['start_date'])
        if 'end_date' in update_data and update_data['end_date']:
            update_data['end_date'] = datetime.fromisoformat(update_data['end_date'])
        
        # 处理状态枚举
        if 'status' in update_data:
            update_data['status'] = PlanStatusEnum(update_data['status'])
        
        for field, value in update_data.items():
            if hasattr(db_plan, field):
                setattr(db_plan, field, value)
        
        db.add(db_plan)
        try:
            db.commit()
            db.refresh(db_plan)
            return db_plan
        except Exception as e:
            db.rollback()
            raise e

    def delete_learning_plan(self, db: Session, plan_id: int) -> bool:
        """删除学习计划"""
        db_plan = self.get_plan_by_id(db, plan_id)
        if not db_plan:
            return False
        db.delete(db_plan)
        try:
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise e

    def update_plan_progress(self, db: Session, plan_id: int, progress: float, ai_suggestions: Optional[str] = None) -> Optional[LearningPlan]:
        """更新学习计划进度"""
        return self.update_learning_plan(db, plan_id, LearningPlanUpdate(
            progress=progress,
            ai_suggestions=ai_suggestions
        ))
