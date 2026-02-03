from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from storage.database.shared.model import User, RoleEnum


class UserCreate(BaseModel):
    """创建用户的Pydantic模型"""
    name: str = Field(..., description="用户姓名")
    email: Optional[str] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, description="手机号")
    role: str = Field(..., description="角色: student或teacher")
    grade_level: Optional[str] = Field(None, description="年级/级别")
    subject: Optional[str] = Field(None, description="专长学科")


class UserUpdate(BaseModel):
    """更新用户的Pydantic模型"""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    grade_level: Optional[str] = None
    subject: Optional[str] = None
    is_active: Optional[bool] = None
    metadata_json: Optional[dict] = None


class UserManager:
    """用户管理Manager"""

    def create_user(self, db: Session, user_in: UserCreate) -> User:
        """创建用户"""
        user_data = user_in.model_dump()
        # 确保role是枚举类型
        if isinstance(user_data['role'], str):
            user_data['role'] = RoleEnum(user_data['role'])
        
        db_user = User(**user_data)
        db.add(db_user)
        try:
            db.commit()
            db.refresh(db_user)
            return db_user
        except Exception as e:
            db.rollback()
            raise e

    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """根据ID获取用户"""
        return db.query(User).filter(User.id == user_id).first()

    def get_users(self, db: Session, skip: int = 0, limit: int = 100, role: Optional[str] = None) -> List[User]:
        """获取用户列表"""
        query = db.query(User)
        if role:
            query = query.filter(User.role == RoleEnum(role))
        return query.offset(skip).limit(limit).all()

    def get_students(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """获取所有学生"""
        return self.get_users(db, skip=skip, limit=limit, role="student")

    def get_teachers(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """获取所有教师"""
        return self.get_users(db, skip=skip, limit=limit, role="teacher")

    def update_user(self, db: Session, user_id: int, user_in: UserUpdate) -> Optional[User]:
        """更新用户信息"""
        db_user = self.get_user_by_id(db, user_id)
        if not db_user:
            return None
        update_data = user_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(db_user, field):
                setattr(db_user, field, value)
        db.add(db_user)
        try:
            db.commit()
            db.refresh(db_user)
            return db_user
        except Exception as e:
            db.rollback()
            raise e

    def delete_user(self, db: Session, user_id: int) -> bool:
        """删除用户"""
        db_user = self.get_user_by_id(db, user_id)
        if not db_user:
            return False
        db.delete(db_user)
        try:
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise e
