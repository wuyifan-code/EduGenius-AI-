from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from storage.database.shared.model import TeachingResource


class TeachingResourceCreate(BaseModel):
    """创建教学资源的Pydantic模型"""
    teacher_id: int = Field(..., description="教师ID")
    title: str = Field(..., description="资源标题")
    resource_type: str = Field(..., description="资源类型: lesson_plan/exercise/courseware/material")
    subject: str = Field(..., description="学科")
    grade_level: Optional[str] = Field(None, description="适用年级")
    content: Optional[str] = Field(None, description="资源内容")
    ai_generated: bool = Field(default=False, description="是否AI生成")
    metadata_json: Optional[dict] = Field(None, description="扩展信息")


class TeachingResourceUpdate(BaseModel):
    """更新教学资源的Pydantic模型"""
    title: Optional[str] = None
    resource_type: Optional[str] = None
    subject: Optional[str] = None
    grade_level: Optional[str] = None
    content: Optional[str] = None
    metadata_json: Optional[dict] = None


class TeachingResourceManager:
    """教学资源管理Manager"""

    def create_teaching_resource(self, db: Session, resource_in: TeachingResourceCreate) -> TeachingResource:
        """创建教学资源"""
        resource_data = resource_in.model_dump()
        db_resource = TeachingResource(**resource_data)
        db.add(db_resource)
        try:
            db.commit()
            db.refresh(db_resource)
            return db_resource
        except Exception as e:
            db.rollback()
            raise e

    def get_resource_by_id(self, db: Session, resource_id: int) -> Optional[TeachingResource]:
        """根据ID获取教学资源"""
        return db.query(TeachingResource).filter(TeachingResource.id == resource_id).first()

    def get_resources_by_teacher(self, db: Session, teacher_id: int, skip: int = 0, limit: int = 100) -> List[TeachingResource]:
        """获取教师的所有教学资源"""
        return db.query(TeachingResource).filter(
            TeachingResource.teacher_id == teacher_id
        ).offset(skip).limit(limit).all()

    def get_resources_by_type(self, db: Session, resource_type: str, skip: int = 0, limit: int = 100) -> List[TeachingResource]:
        """根据类型获取教学资源"""
        return db.query(TeachingResource).filter(
            TeachingResource.resource_type == resource_type
        ).offset(skip).limit(limit).all()

    def get_resources_by_subject(self, db: Session, subject: str, skip: int = 0, limit: int = 100) -> List[TeachingResource]:
        """根据学科获取教学资源"""
        return db.query(TeachingResource).filter(
            TeachingResource.subject == subject
        ).offset(skip).limit(limit).all()

    def get_ai_generated_resources(self, db: Session, skip: int = 0, limit: int = 100) -> List[TeachingResource]:
        """获取AI生成的资源"""
        return db.query(TeachingResource).filter(
            TeachingResource.ai_generated == True
        ).offset(skip).limit(limit).all()

    def update_teaching_resource(self, db: Session, resource_id: int, resource_in: TeachingResourceUpdate) -> Optional[TeachingResource]:
        """更新教学资源"""
        db_resource = self.get_resource_by_id(db, resource_id)
        if not db_resource:
            return None
        update_data = resource_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(db_resource, field):
                setattr(db_resource, field, value)
        db.add(db_resource)
        try:
            db.commit()
            db.refresh(db_resource)
            return db_resource
        except Exception as e:
            db.rollback()
            raise e

    def delete_teaching_resource(self, db: Session, resource_id: int) -> bool:
        """删除教学资源"""
        db_resource = self.get_resource_by_id(db, resource_id)
        if not db_resource:
            return False
        db.delete(db_resource)
        try:
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise e
