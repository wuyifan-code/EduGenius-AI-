from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from storage.database.shared.model import OnlineTest, TestQuestion, StudentAnswer, TestStatusEnum, QuestionTypeEnum
from datetime import datetime


class OnlineTestCreate(BaseModel):
    """创建测试的Pydantic模型"""
    teacher_id: int = Field(..., description="教师ID")
    title: str = Field(..., description="测试标题")
    subject: str = Field(..., description="学科")
    grade_level: Optional[str] = Field(None, description="适用年级")
    description: Optional[str] = Field(None, description="测试描述")
    duration_minutes: int = Field(..., description="测试时长(分钟)")
    total_score: float = Field(..., description="总分")


class OnlineTestUpdate(BaseModel):
    """更新测试的Pydantic模型"""
    status: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class TestQuestionCreate(BaseModel):
    """创建题目的Pydantic模型"""
    test_id: int = Field(..., description="测试ID")
    question_text: str = Field(..., description="题目内容")
    question_type: str = Field(..., description="题目类型")
    options: Optional[dict] = Field(None, description="选项")
    correct_answer: Optional[str] = Field(None, description="正确答案")
    points: float = Field(..., description="分值")
    order: int = Field(..., description="题目顺序")
    explanation: Optional[str] = Field(None, description="题目解析")


class StudentAnswerCreate(BaseModel):
    """创建答题记录的Pydantic模型"""
    test_id: int = Field(..., description="测试ID")
    question_id: int = Field(..., description="题目ID")
    student_id: int = Field(..., description="学生ID")
    answer_content: str = Field(..., description="学生答案")
    time_spent_seconds: int = Field(..., description="答题用时(秒)")


class OnlineTestManager:
    """在线测试管理Manager"""

    def create_test(self, db: Session, test_in: OnlineTestCreate) -> OnlineTest:
        """创建测试"""
        test_data = test_in.model_dump()
        db_test = OnlineTest(**test_data)
        db.add(db_test)
        try:
            db.commit()
            db.refresh(db_test)
            return db_test
        except Exception as e:
            db.rollback()
            raise e

    def get_test_by_id(self, db: Session, test_id: int) -> Optional[OnlineTest]:
        """根据ID获取测试"""
        return db.query(OnlineTest).filter(OnlineTest.id == test_id).first()

    def get_tests_by_teacher(self, db: Session, teacher_id: int, skip: int = 0, limit: int = 100) -> List[OnlineTest]:
        """获取教师的所有测试"""
        return db.query(OnlineTest).filter(
            OnlineTest.teacher_id == teacher_id
        ).offset(skip).limit(limit).all()

    def update_test(self, db: Session, test_id: int, test_in: OnlineTestUpdate) -> Optional[OnlineTest]:
        """更新测试"""
        db_test = self.get_test_by_id(db, test_id)
        if not db_test:
            return None
        update_data = test_in.model_dump(exclude_unset=True)
        if 'start_time' in update_data and update_data['start_time']:
            update_data['start_time'] = datetime.fromisoformat(update_data['start_time'])
        if 'end_time' in update_data and update_data['end_time']:
            update_data['end_time'] = datetime.fromisoformat(update_data['end_time'])
        if 'status' in update_data:
            update_data['status'] = TestStatusEnum(update_data['status'])
        for field, value in update_data.items():
            if hasattr(db_test, field):
                setattr(db_test, field, value)
        db.add(db_test)
        try:
            db.commit()
            db.refresh(db_test)
            return db_test
        except Exception as e:
            db.rollback()
            raise e


class TestQuestionManager:
    """测试题目管理Manager"""

    def create_question(self, db: Session, question_in: TestQuestionCreate) -> TestQuestion:
        """创建题目"""
        question_data = question_in.model_dump()
        question_data['question_type'] = QuestionTypeEnum(question_data['question_type'])
        db_question = TestQuestion(**question_data)
        db.add(db_question)
        try:
            db.commit()
            db.refresh(db_question)
            return db_question
        except Exception as e:
            db.rollback()
            raise e

    def get_questions_by_test(self, db: Session, test_id: int) -> List[TestQuestion]:
        """获取测试的所有题目"""
        return db.query(TestQuestion).filter(
            TestQuestion.test_id == test_id
        ).order_by(TestQuestion.order).all()

    def get_question_by_id(self, db: Session, question_id: int) -> Optional[TestQuestion]:
        """根据ID获取题目"""
        return db.query(TestQuestion).filter(TestQuestion.id == question_id).first()


class StudentAnswerManager:
    """学生答题管理Manager"""

    def create_answer(self, db: Session, answer_in: StudentAnswerCreate) -> StudentAnswer:
        """创建答题记录"""
        answer_data = answer_in.model_dump()
        db_answer = StudentAnswer(**answer_data)
        db.add(db_answer)
        try:
            db.commit()
            db.refresh(db_answer)
            return db_answer
        except Exception as e:
            db.rollback()
            raise e

    def get_answers_by_test_and_student(self, db: Session, test_id: int, student_id: int) -> List[StudentAnswer]:
        """获取学生在某个测试的所有答题记录"""
        return db.query(StudentAnswer).filter(
            StudentAnswer.test_id == test_id,
            StudentAnswer.student_id == student_id
        ).all()

    def calculate_test_score(self, db: Session, test_id: int, student_id: int) -> float:
        """计算学生在某个测试的总分"""
        answers = self.get_answers_by_test_and_student(db, test_id, student_id)
        return sum(a.score for a in answers)
