import os
import json
from typing import Annotated
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langgraph.graph.message import add_messages
from langchain_core.messages import AnyMessage
from coze_coding_utils.runtime_ctx.context import default_headers
from storage.memory.memory_saver import get_memory_saver

# 导入工具
from tools.user_management_tool import (
    create_student,
    create_teacher,
    get_student_info,
    list_students
)
from tools.learning_plan_tool import (
    create_learning_plan,
    get_student_plans,
    update_plan_progress,
    get_plan_details
)
from tools.learning_record_tool import (
    add_learning_record,
    get_student_records,
    get_student_statistics,
    add_ai_feedback
)
from tools.teaching_resource_tool import (
    create_teaching_resource,
    get_teacher_resources,
    get_resources_by_subject
)
# 新工具导入
from tools.storage_tool import (
    upload_file_to_storage,
    download_file_from_storage,
    delete_file_from_storage,
    generate_file_url
)
from tools.search_tool import (
    search_teaching_resources,
    search_latest_materials,
    search_with_summary
)
from tools.image_generation_tool import (
    generate_chart_image,
    generate_diagram,
    generate_visual_material
)
from tools.knowledge_tool import (
    add_to_knowledge_base,
    add_url_to_knowledge_base,
    search_knowledge_base
)
from tools.voice_tool import (
    text_to_speech,
    speech_to_text,
    generate_lesson_audio,
    generate_storytelling_audio
)
from tools.homework_tool import (
    create_homework,
    submit_homework,
    grade_homework,
    get_student_homeworks
)
from tools.online_test_tool import (
    create_online_test,
    add_test_question,
    submit_answer,
    get_test_results
)
from tools.learning_report_tool import (
    generate_learning_report,
    get_student_reports,
    generate_trend_report
)
from tools.voice_conversation_tool import (
    voice_conversation,
    voice_qa_session,
    voice_homework_help,
    get_voice_conversation_guide
)
from tools.question_bank_tool import (
    add_question_to_bank,
    search_similar_questions,
    answer_with_similar_questions,
    get_question_by_id,
    get_questions_by_subject
)

LLM_CONFIG = "config/agent_llm_config.json"

# 默认保留最近 20 轮对话 (40 条消息)
MAX_MESSAGES = 40

def _windowed_messages(old, new):
    """滑动窗口: 只保留最近 MAX_MESSAGES 条消息"""
    combined = old + new
    return combined[-MAX_MESSAGES:]

class AgentState(MessagesState):
    messages: Annotated[list[AnyMessage], _windowed_messages]

def build_agent(ctx=None):
    """构建教育AI智能体"""
    workspace_path = os.getenv("COZE_WORKSPACE_PATH", "/workspace/projects")
    config_path = os.path.join(workspace_path, LLM_CONFIG)
    
    with open(config_path, 'r', encoding='utf-8') as f:
        cfg = json.load(f)
    
    api_key = os.getenv("COZE_WORKLOAD_IDENTITY_API_KEY")
    base_url = os.getenv("COZE_INTEGRATION_MODEL_BASE_URL")
    
    llm = ChatOpenAI(
        model=cfg['config'].get("model"),
        api_key=api_key,
        base_url=base_url,
        temperature=cfg['config'].get('temperature', 0.7),
        streaming=True,
        timeout=cfg['config'].get('timeout', 600),
        extra_body={
            "thinking": {
                "type": cfg['config'].get('thinking', 'disabled')
            }
        },
        default_headers=default_headers(ctx) if ctx else {}
    )
    
    # 定义所有工具
    tools = [
        # 用户管理工具
        create_student,
        create_teacher,
        get_student_info,
        list_students,
        
        # 学习计划工具
        create_learning_plan,
        get_student_plans,
        update_plan_progress,
        get_plan_details,
        
        # 学习记录工具
        add_learning_record,
        get_student_records,
        get_student_statistics,
        add_ai_feedback,
        
        # 教学资源工具
        create_teaching_resource,
        get_teacher_resources,
        get_resources_by_subject,
        
        # 对象存储工具
        upload_file_to_storage,
        download_file_from_storage,
        delete_file_from_storage,
        generate_file_url,
        
        # 联网搜索工具
        search_teaching_resources,
        search_latest_materials,
        search_with_summary,
        
        # 生图工具
        generate_chart_image,
        generate_diagram,
        generate_visual_material,
        
        # 知识库工具
        add_to_knowledge_base,
        add_url_to_knowledge_base,
        search_knowledge_base,
        
        # 语音工具
        text_to_speech,
        speech_to_text,
        generate_lesson_audio,
        generate_storytelling_audio,
        
        # 作业工具
        create_homework,
        submit_homework,
        grade_homework,
        get_student_homeworks,
        
        # 在线测试工具
        create_online_test,
        add_test_question,
        submit_answer,
        get_test_results,
        
        # 学习报告工具
        generate_learning_report,
        get_student_reports,
        generate_trend_report,
        
        # 语音对话工具
        voice_conversation,
        voice_qa_session,
        voice_homework_help,
        get_voice_conversation_guide,
        
        # 题库工具
        add_question_to_bank,
        search_similar_questions,
        answer_with_similar_questions,
        get_question_by_id,
        get_questions_by_subject,
    ]
    
    return create_agent(
        model=llm,
        system_prompt=cfg.get("sp"),
        tools=tools,
        checkpointer=get_memory_saver(),
        state_schema=AgentState,
    )
