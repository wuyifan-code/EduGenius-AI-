from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, JSON, func, Enum as SQLEnum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from typing import Optional
from datetime import datetime
from coze_coding_dev_sdk.database import Base
import enum


class RoleEnum(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"


class PlanStatusEnum(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RecordTypeEnum(str, enum.Enum):
    STUDY = "study"
    HOMEWORK = "homework"
    TEST = "test"
    REVIEW = "review"


class User(Base):
    """用户表 - 存储教师和学生基本信息"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="用户ID")
    name: Mapped[str] = mapped_column(String(128), nullable=False, comment="用户姓名")
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True, comment="邮箱")
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, comment="手机号")
    role: Mapped[RoleEnum] = mapped_column(SQLEnum(RoleEnum), nullable=False, comment="角色: student或teacher")
    grade_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="年级/级别")
    subject: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="专长学科")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, comment="是否活跃")
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, comment="扩展信息")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True, comment="更新时间")

    # 关系
    learning_plans: Mapped[list["LearningPlan"]] = relationship("LearningPlan", back_populates="student", foreign_keys="LearningPlan.student_id")
    learning_records: Mapped[list["LearningRecord"]] = relationship("LearningRecord", back_populates="student")
    teaching_resources: Mapped[list["TeachingResource"]] = relationship("TeachingResource", back_populates="teacher")

    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_role", "role"),
    )


class LearningPlan(Base):
    """学习计划表 - 存储学生的学习计划"""
    __tablename__ = "learning_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="计划ID")
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, comment="学生ID")
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="计划标题")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="计划描述")
    subject: Mapped[str] = mapped_column(String(100), nullable=False, comment="学科")
    target_goals: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="学习目标")
    schedule: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, comment="学习安排(日程表)")
    status: Mapped[PlanStatusEnum] = mapped_column(SQLEnum(PlanStatusEnum), default=PlanStatusEnum.PENDING, nullable=False, comment="计划状态")
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="开始日期")
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="结束日期")
    progress: Mapped[float] = mapped_column(Float, default=0.0, nullable=False, comment="完成进度(0-100)")
    ai_suggestions: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="AI建议")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True, comment="更新时间")

    # 关系
    student: Mapped["User"] = relationship("User", back_populates="learning_plans", foreign_keys=[student_id])
    learning_records: Mapped[list["LearningRecord"]] = relationship("LearningRecord", back_populates="plan")

    __table_args__ = (
        Index("ix_learning_plans_student_id", "student_id"),
        Index("ix_learning_plans_status", "status"),
    )


class LearningRecord(Base):
    """学习记录表 - 记录学生的学习活动"""
    __tablename__ = "learning_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="记录ID")
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, comment="学生ID")
    plan_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("learning_plans.id"), nullable=True, comment="关联计划ID")
    record_type: Mapped[RecordTypeEnum] = mapped_column(SQLEnum(RecordTypeEnum), nullable=False, comment="记录类型: study/homework/test/review")
    subject: Mapped[str] = mapped_column(String(100), nullable=False, comment="学科")
    topic: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="学习主题")
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="学习内容")
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="学习时长(分钟)")
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="成绩/分数")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="备注")
    ai_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="AI反馈")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="记录时间")

    # 关系
    student: Mapped["User"] = relationship("User", back_populates="learning_records")
    plan: Mapped["LearningPlan"] = relationship("LearningPlan", back_populates="learning_records")

    __table_args__ = (
        Index("ix_learning_records_student_id", "student_id"),
        Index("ix_learning_records_plan_id", "plan_id"),
        Index("ix_learning_records_created_at", "created_at"),
    )


class TeachingResource(Base):
    """教学资源表 - 存储教师的教学资源"""
    __tablename__ = "teaching_resources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="资源ID")
    teacher_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, comment="教师ID")
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="资源标题")
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False, comment="资源类型: lesson_plan/exercise/courseware/material")
    subject: Mapped[str] = mapped_column(String(100), nullable=False, comment="学科")
    grade_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="适用年级")
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="资源内容")
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="是否AI生成")
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, comment="扩展信息")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True, comment="更新时间")

    # 关系
    teacher: Mapped["User"] = relationship("User", back_populates="teaching_resources")

    __table_args__ = (
        Index("ix_teaching_resources_teacher_id", "teacher_id"),
        Index("ix_teaching_resources_type", "resource_type"),
        Index("ix_teaching_resources_subject", "subject"),
    )
