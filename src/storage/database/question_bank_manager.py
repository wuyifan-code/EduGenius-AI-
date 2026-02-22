"""
题库管理器 - 管理题库和相似题型推荐
"""
from sqlalchemy import create_engine, select, and_, or_, func
from sqlalchemy.orm import sessionmaker, Session
from typing import Optional, List, Dict, Any
from coze_coding_dev_sdk.database import get_db_url
from coze_coding_dev_sdk import EmbeddingClient
from coze_coding_utils.runtime_ctx.context import new_context
import os
from datetime import datetime
from storage.database.shared.model import QuestionBank, QuestionTypeEnum


class QuestionBankManager:
    """题库管理器"""
    
    def __init__(self):
        """初始化题库管理器"""
        self.engine = create_engine(get_db_url())
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.embedding_client = None
    
    def get_session(self) -> Session:
        """获取数据库会话"""
        return self.SessionLocal()
    
    def get_embedding_client(self):
        """获取Embedding客户端"""
        if self.embedding_client is None:
            ctx = new_context(method="embedding.embed")
            self.embedding_client = EmbeddingClient(ctx=ctx)
        return self.embedding_client
    
    def add_question(
        self,
        subject: str,
        question_text: str,
        question_type: str,
        correct_answer: str,
        difficulty: int = 3,
        grade_level: Optional[str] = None,
        topic: Optional[str] = None,
        options: Optional[Dict] = None,
        explanation: Optional[str] = None,
        tags: Optional[Dict] = None
    ) -> int:
        """添加题目到题库
        
        Args:
            subject: 学科
            question_text: 题目内容
            question_type: 题目类型
            correct_answer: 正确答案
            difficulty: 难度等级(1-5)
            grade_level: 年级
            topic: 知识点/主题
            options: 选项（选择题使用）
            explanation: 题目解析
            tags: 标签（知识点）
        
        Returns:
            题目ID
        """
        session = self.get_session()
        try:
            # 生成向量表示
            embedding = self._generate_embedding(question_text + " " + (topic or ""))
            
            question = QuestionBank(
                subject=subject,
                grade_level=grade_level,
                difficulty=difficulty,
                question_type=QuestionTypeEnum(question_type),
                topic=topic,
                question_text=question_text,
                options=options,
                correct_answer=correct_answer,
                explanation=explanation,
                tags=tags or {},
                embedding=embedding,
                usage_count=0,
                is_active=True
            )
            
            session.add(question)
            session.commit()
            session.refresh(question)
            
            return question.id
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def _generate_embedding(self, text: str) -> List[float]:
        """生成文本向量表示"""
        try:
            embedding_client = self.get_embedding_client()
            result, _ = embedding_client.embed(
                texts=[text],
                model="bge_m3"
            )
            
            if result and len(result) > 0:
                return result[0]
            return []
            
        except Exception as e:
            print(f"生成向量失败: {e}")
            return []
    
    def search_similar_questions(
        self,
        query_text: str,
        subject: Optional[str] = None,
        difficulty: Optional[int] = None,
        grade_level: Optional[str] = None,
        topic: Optional[str] = None,
        limit: int = 5,
        exclude_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """搜索相似题型
        
        Args:
            query_text: 查询文本
            subject: 学科（可选）
            difficulty: 难度等级（可选）
            grade_level: 年级（可选）
            topic: 知识点（可选）
            limit: 返回数量
            exclude_id: 排除的题目ID（排除当前问题）
        
        Returns:
            相似题目列表
        """
        session = self.get_session()
        try:
            # 构建查询条件
            conditions = [QuestionBank.is_active == True]
            
            if subject:
                conditions.append(QuestionBank.subject == subject)
            if difficulty:
                conditions.append(QuestionBank.difficulty == difficulty)
            if grade_level:
                conditions.append(QuestionBank.grade_level == grade_level)
            if topic:
                conditions.append(QuestionBank.topic == topic)
            if exclude_id:
                conditions.append(QuestionBank.id != exclude_id)
            
            # 先按条件筛选
            query = select(QuestionBank).where(and_(*conditions))
            
            # 查询候选题目
            candidate_questions = session.execute(query).scalars().all()
            
            if not candidate_questions:
                return []
            
            # 生成查询向量
            query_embedding = self._generate_embedding(query_text)
            
            if not query_embedding:
                # 如果向量生成失败，按使用次数降序返回
                result = []
                for q in candidate_questions[:limit]:
                    result.append(self._question_to_dict(q))
                return result
            
            # 计算相似度
            similarities = []
            for question in candidate_questions:
                question_embedding = question.embedding or []
                similarity = self._cosine_similarity(query_embedding, question_embedding)
                similarities.append((question, similarity))
            
            # 按相似度降序排序
            similarities.sort(key=lambda x: x[1], reverse=True)
            
            # 返回最相似的N个题目
            result = []
            for question, similarity in similarities[:limit]:
                question_dict = self._question_to_dict(question)
                question_dict['similarity'] = round(similarity * 100, 2)
                result.append(question_dict)
            
            return result
            
        except Exception as e:
            print(f"搜索相似题目失败: {e}")
            return []
        finally:
            session.close()
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """计算余弦相似度"""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        
        try:
            import math
            
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            norm1 = math.sqrt(sum(a * a for a in vec1))
            norm2 = math.sqrt(sum(b * b for b in vec2))
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return dot_product / (norm1 * norm2)
            
        except Exception as e:
            print(f"计算相似度失败: {e}")
            return 0.0
    
    def _question_to_dict(self, question: QuestionBank) -> Dict[str, Any]:
        """将题目对象转换为字典"""
        return {
            'id': question.id,
            'subject': question.subject,
            'grade_level': question.grade_level,
            'difficulty': question.difficulty,
            'question_type': question.question_type.value,
            'topic': question.topic,
            'question_text': question.question_text,
            'options': question.options,
            'correct_answer': question.correct_answer,
            'explanation': question.explanation,
            'tags': question.tags,
            'usage_count': question.usage_count,
            'created_at': question.created_at.isoformat() if question.created_at else None
        }
    
    def get_question_by_id(self, question_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取题目"""
        session = self.get_session()
        try:
            question = session.execute(
                select(QuestionBank).where(QuestionBank.id == question_id)
            ).scalar_one_or_none()
            
            if question:
                return self._question_to_dict(question)
            return None
            
        except Exception as e:
            print(f"获取题目失败: {e}")
            return None
        finally:
            session.close()
    
    def get_questions_by_subject(
        self,
        subject: str,
        grade_level: Optional[str] = None,
        difficulty: Optional[int] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """根据学科获取题目列表"""
        session = self.get_session()
        try:
            conditions = [
                QuestionBank.subject == subject,
                QuestionBank.is_active == True
            ]
            
            if grade_level:
                conditions.append(QuestionBank.grade_level == grade_level)
            if difficulty:
                conditions.append(QuestionBank.difficulty == difficulty)
            
            query = select(QuestionBank).where(and_(*conditions)).limit(limit)
            questions = session.execute(query).scalars().all()
            
            return [self._question_to_dict(q) for q in questions]
            
        except Exception as e:
            print(f"获取题目列表失败: {e}")
            return []
        finally:
            session.close()
    
    def increment_usage_count(self, question_id: int) -> bool:
        """增加题目使用次数"""
        session = self.get_session()
        try:
            question = session.execute(
                select(QuestionBank).where(QuestionBank.id == question_id)
            ).scalar_one_or_none()
            
            if question:
                question.usage_count += 1
                session.commit()
                return True
            return False
            
        except Exception as e:
            session.rollback()
            print(f"增加使用次数失败: {e}")
            return False
        finally:
            session.close()
    
    def delete_question(self, question_id: int) -> bool:
        """删除题目（软删除）"""
        session = self.get_session()
        try:
            question = session.execute(
                select(QuestionBank).where(QuestionBank.id == question_id)
            ).scalar_one_or_none()
            
            if question:
                question.is_active = False
                session.commit()
                return True
            return False
            
        except Exception as e:
            session.rollback()
            print(f"删除题目失败: {e}")
            return False
        finally:
            session.close()


# 全局实例
_question_bank_manager = None

def get_question_bank_manager():
    """获取题库管理器实例"""
    global _question_bank_manager
    if _question_bank_manager is None:
        _question_bank_manager = QuestionBankManager()
    return _question_bank_manager
