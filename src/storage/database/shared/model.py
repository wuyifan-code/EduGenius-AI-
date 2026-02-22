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


class HomeworkStatusEnum(str, enum.Enum):
    ASSIGNED = "assigned"
    SUBMITTED = "submitted"
    GRADED = "graded"
    OVERDUE = "overdue"


class Homework(Base):
    """作业表 - 存储作业信息"""
    __tablename__ = "homework"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="作业ID")
    teacher_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, comment="教师ID")
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, comment="学生ID")
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="作业标题")
    subject: Mapped[str] = mapped_column(String(100), nullable=False, comment="学科")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="作业描述")
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="作业内容")
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="截止日期")
    status: Mapped[HomeworkStatusEnum] = mapped_column(SQLEnum(HomeworkStatusEnum), default=HomeworkStatusEnum.ASSIGNED, nullable=False, comment="作业状态")
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="得分")
    ai_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="AI批改反馈")
    submission_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="学生提交内容")
    submission_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="提交时间")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True, comment="更新时间")

    # 关系
    teacher: Mapped["User"] = relationship("User", foreign_keys=[teacher_id])
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id])

    __table_args__ = (
        Index("ix_homework_teacher_id", "teacher_id"),
        Index("ix_homework_student_id", "student_id"),
        Index("ix_homework_status", "status"),
    )


class TestStatusEnum(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class OnlineTest(Base):
    """在线测试表 - 存储测试信息"""
    __tablename__ = "online_tests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="测试ID")
    teacher_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, comment="教师ID")
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="测试标题")
    subject: Mapped[str] = mapped_column(String(100), nullable=False, comment="学科")
    grade_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="适用年级")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="测试描述")
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, comment="测试时长(分钟)")
    total_score: Mapped[float] = mapped_column(Float, nullable=False, comment="总分")
    status: Mapped[TestStatusEnum] = mapped_column(SQLEnum(TestStatusEnum), default=TestStatusEnum.DRAFT, nullable=False, comment="测试状态")
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="开始时间")
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="结束时间")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True, comment="更新时间")

    # 关系
    teacher: Mapped["User"] = relationship("User", foreign_keys=[teacher_id])
    questions: Mapped[list["TestQuestion"]] = relationship("TestQuestion", back_populates="test")
    answers: Mapped[list["StudentAnswer"]] = relationship("StudentAnswer", back_populates="test")

    __table_args__ = (
        Index("ix_online_tests_teacher_id", "teacher_id"),
        Index("ix_online_tests_status", "status"),
    )


class QuestionTypeEnum(str, enum.Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"


class TestQuestion(Base):
    """测试题目表 - 存储测试题目"""
    __tablename__ = "test_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="题目ID")
    test_id: Mapped[int] = mapped_column(Integer, ForeignKey("online_tests.id"), nullable=False, comment="测试ID")
    question_text: Mapped[str] = mapped_column(Text, nullable=False, comment="题目内容")
    question_type: Mapped[QuestionTypeEnum] = mapped_column(SQLEnum(QuestionTypeEnum), nullable=False, comment="题目类型")
    options: Mapped[Optional[str]] = mapped_column(JSON, nullable=True, comment="选项（选择题使用）")
    correct_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="正确答案")
    points: Mapped[float] = mapped_column(Float, nullable=False, comment="分值")
    order: Mapped[int] = mapped_column(Integer, nullable=False, comment="题目顺序")
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="题目解析")

    # 关系
    test: Mapped["OnlineTest"] = relationship("OnlineTest", back_populates="questions")
    answers: Mapped[list["StudentAnswer"]] = relationship("StudentAnswer", back_populates="question")

    __table_args__ = (
        Index("ix_test_questions_test_id", "test_id"),
        Index("ix_test_questions_order", "order"),
    )


class StudentAnswer(Base):
    """学生答题表 - 存储学生答题记录"""
    __tablename__ = "student_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="答题记录ID")
    test_id: Mapped[int] = mapped_column(Integer, ForeignKey("online_tests.id"), nullable=False, comment="测试ID")
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("test_questions.id"), nullable=False, comment="题目ID")
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, comment="学生ID")
    answer_content: Mapped[str] = mapped_column(Text, nullable=False, comment="学生答案")
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, comment="是否正确")
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False, comment="得分")
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="答题用时(秒)")
    ai_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="AI反馈")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="答题时间")

    # 关系
    test: Mapped["OnlineTest"] = relationship("OnlineTest", back_populates="answers")
    question: Mapped["TestQuestion"] = relationship("TestQuestion", back_populates="answers")
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id])

    __table_args__ = (
        Index("ix_student_answers_test_id", "test_id"),
        Index("ix_student_answers_student_id", "student_id"),
    )


class ReportTypeEnum(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    PROGRESS = "progress"
    ASSESSMENT = "assessment"


class LearningReport(Base):
    """学习报告表 - 存储学习分析报告"""
    __tablename__ = "learning_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="报告ID")
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, comment="学生ID")
    report_type: Mapped[ReportTypeEnum] = mapped_column(SQLEnum(ReportTypeEnum), nullable=False, comment="报告类型")
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="报告标题")
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="报告内容")
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="报告摘要")
    statistics: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, comment="统计数据")
    ai_suggestions: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="AI建议")
    report_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="报告日期")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")

    # 关系
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id])

    __table_args__ = (
        Index("ix_learning_reports_student_id", "student_id"),
        Index("ix_learning_reports_type", "report_type"),
    )


class KnowledgeBaseEntry(Base):
    """知识库条目表 - 存储教学参考材料"""
    __tablename__ = "knowledge_base_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="条目ID")
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="标题")
    subject: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="学科")
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="内容")
    source_type: Mapped[str] = mapped_column(String(50), nullable=False, comment="来源类型: text/url/uri")
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, comment="来源URL")
    knowledge_table: Mapped[str] = mapped_column(String(100), nullable=False, comment="知识库表名")
    doc_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="文档ID")
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, comment="扩展信息")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True, comment="更新时间")

    __table_args__ = (
        Index("ix_knowledge_base_entries_subject", "subject"),
        Index("ix_knowledge_base_entries_table", "knowledge_table"),
    )


class QuestionBank(Base):
    """题库表 - 存储题目和相似题型推荐"""
    __tablename__ = "question_bank"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="题目ID")
    subject: Mapped[str] = mapped_column(String(100), nullable=False, comment="学科")
    grade_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="年级")
    difficulty: Mapped[int] = mapped_column(Integer, default=3, nullable=False, comment="难度等级(1-5)")
    question_type: Mapped[QuestionTypeEnum] = mapped_column(SQLEnum(QuestionTypeEnum), nullable=False, comment="题目类型")
    topic: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="知识点/主题")
    question_text: Mapped[str] = mapped_column(Text, nullable=False, comment="题目内容")
    options: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, comment="选项（选择题使用）")
    correct_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="正确答案")
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="题目解析")
    tags: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, comment="标签（知识点）")
    embedding: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, comment="向量表示（用于相似度计算）")
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="使用次数")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, comment="是否启用")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True, comment="更新时间")

    __table_args__ = (
        Index("ix_question_bank_subject", "subject"),
        Index("ix_question_bank_difficulty", "difficulty"),
        Index("ix_question_bank_type", "question_type"),
        Index("ix_question_bank_topic", "topic"),
    )
