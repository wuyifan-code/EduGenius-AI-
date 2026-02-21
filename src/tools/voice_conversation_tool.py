from langchain.tools import tool
from coze_coding_dev_sdk import TTSClient, ASRClient, LLMClient
from coze_coding_utils.runtime_ctx.context import new_context
from coze_coding_dev_sdk.s3 import S3SyncStorage
from langchain_core.messages import HumanMessage, SystemMessage
import os
import base64


@tool
def voice_conversation(audio_base64: str, speaker_id: str = "student", system_prompt: str = None) -> str:
    """学生与AI进行语音对话（近实时）
    
    Args:
        audio_base64: 学生语音的Base64编码（MP3/WAV格式）
        speaker_id: 说话人ID，用于追踪对话
        system_prompt: 系统提示词（可选，设置AI的角色和行为）
    
    Returns:
        AI的语音回复URL和识别的文本
    
    流程：
    1. 上传音频到对象存储
    2. ASR识别语音为文本
    3. LLM生成回复文本
    4. TTS合成回复语音
    5. 返回语音URL
    """
    try:
        # Step 1: 上传音频到对象存储
        ctx_audio = new_context(method="upload")
        storage = S3SyncStorage(
            endpoint_url=os.getenv("COZE_BUCKET_ENDPOINT_URL"),
            access_key="",
            secret_key="",
            bucket_name=os.getenv("COZE_BUCKET_NAME"),
            region="cn-beijing",
        )
        
        # 解码Base64音频
        audio_data = base64.b64decode(audio_base64)
        
        # 上传音频
        audio_key = storage.upload_file(
            file_content=audio_data,
            file_name=f"voice_input_{speaker_id}_{id(audio_data)}.mp3",
            content_type="audio/mpeg"
        )
        
        # 生成音频URL
        audio_url = storage.generate_presigned_url(key=audio_key, expire_time=600)
        
        # Step 2: ASR识别语音
        ctx_asr = new_context(method="asr.recognize")
        asr_client = ASRClient(ctx=ctx_asr)
        
        recognized_text, _ = asr_client.recognize(
            uid=speaker_id,
            url=audio_url
        )
        
        if not recognized_text:
            return "❌ 语音识别失败，请重试"
        
        # Step 3: LLM生成回复
        ctx_llm = new_context(method="llm.invoke")
        llm_client = LLMClient(ctx=ctx_llm)
        
        # 默认系统提示词
        default_system = """你是一位专业的教育AI助教，擅长解答学生的学习问题。
请用简洁、友好的语言回答学生的问题，必要时给予鼓励和指导。
回答要控制在100字以内，适合语音表达。"""
        
        messages = [
            SystemMessage(content=system_prompt or default_system),
            HumanMessage(content=recognized_text)
        ]
        
        response = llm_client.invoke(messages=messages)
        
        # 处理响应内容
        if isinstance(response.content, str):
            reply_text = response.content
        elif isinstance(response.content, list):
            # 处理多模态响应
            text_parts = [item.get("text", "") for item in response.content if isinstance(item, dict) and item.get("type") == "text"]
            reply_text = " ".join(text_parts)
        else:
            reply_text = str(response.content)
        
        # Step 4: TTS合成回复语音
        ctx_tts = new_context(method="tts.synthesize")
        tts_client = TTSClient(ctx=ctx_tts)
        
        reply_audio_url, _ = tts_client.synthesize(
            uid=f"ai_{speaker_id}",
            text=reply_text,
            speaker="zh_female_xiaohe_uranus_bigtts",  # 使用友好的女声
            audio_format="mp3",
            speech_rate=10  # 稍快一点，适合对话
        )
        
        # Step 5: 返回结果
        result = f"✅ 语音对话完成\n\n"
        result += f"🗣️ 学生说：{recognized_text}\n\n"
        result += f"🤖 AI回复：{reply_text}\n\n"
        result += f"🔊 语音URL：{reply_audio_url}\n"
        result += f"⏱️ 总延迟：约3-5秒"
        
        return result
        
    except Exception as e:
        return f"❌ 语音对话失败：{str(e)}"


@tool
def voice_qa_session(audio_base64: str, student_id: int, subject: str = "数学") -> str:
    """学科特定的语音问答（带学科上下文）
    
    Args:
        audio_base64: 学生语音的Base64编码
        student_id: 学生ID
        subject: 学科（数学、英语、物理等）
    
    Returns:
        AI的语音回复URL和识别的文本
    """
    try:
        # 根据学科设置不同的系统提示词
        subject_prompts = {
            "数学": """你是一位专业的数学老师AI助教，擅长用简单易懂的语言讲解数学概念。
重点：帮助学生理解解题思路，而不是直接给出答案。
回答要简洁、有逻辑，控制在80字以内。""",
            "英语": """你是一位英语老师AI助教，擅长纠正学生的发音和语法错误。
重点：帮助学生建立英语思维，提供实用的表达建议。
回答要用简单英语或中文，控制在80字以内。""",
            "物理": """你是一位物理老师AI助教，擅长用生活中的例子解释物理现象。
重点：帮助学生理解物理原理和公式的实际应用。
回答要生动有趣，控制在80字以内。""",
            "化学": """你是一位化学老师AI助教，擅长用实验和反应原理解释化学现象。
重点：帮助学生理解化学反应的本质和规律。
回答要清晰明了，控制在80字以内。""",
        }
        
        system_prompt = subject_prompts.get(subject, """你是一位专业的教育AI助教，擅长解答学生的学习问题。
请用简洁、友好的语言回答学生的问题，必要时给予鼓励和指导。
回答要控制在100字以内。""")
        
        # 调用通用语音对话
        return voice_conversation(audio_base64, speaker_id=f"student_{student_id}", system_prompt=system_prompt)
        
    except Exception as e:
        return f"❌ 语音问答失败：{str(e)}"


@tool
def voice_homework_help(audio_base64: str, student_id: int, homework_id: int) -> str:
    """作业辅导语音对话
    
    Args:
        audio_base64: 学生语音的Base64编码
        student_id: 学生ID
        homework_id: 作业ID
    
    Returns:
        AI的语音回复URL和识别的文本
    """
    try:
        # 获取作业信息（这里需要调用数据库获取作业详情）
        # 简化版：生成针对作业的提示词
        
        system_prompt = f"""你是一位耐心细致的作业辅导AI老师。
当前正在辅导学生完成作业（作业ID：{homework_id}）。
重点：
1. 不要直接给出答案，而是引导学生思考
2. 用提问的方式帮助学生理解
3. 提供解题思路和关键步骤
4. 鼓励学生独立完成
回答要简短、有引导性，控制在80字以内。"""
        
        return voice_conversation(audio_base64, speaker_id=f"homework_{student_id}", system_prompt=system_prompt)
        
    except Exception as e:
        return f"❌ 作业辅导失败：{str(e)}"


@tool
def get_voice_conversation_guide() -> str:
    """获取语音对话使用指南"""
    guide = """
# 📞 语音对话使用指南

## 🎯 适用场景
- 作业辅导：学生遇到难题时，语音提问获取指导
- 概念解释：学生不理解某个知识点时，语音提问获取解释
- 学习规划：学生咨询学习计划和学习建议
- 答疑解惑：学生有学习疑问时，快速语音答疑

## 📱 使用步骤

### 学生端（建议配合前端应用）
1. **录制语音**：学生按下录音键，说出问题（建议1-2句）
2. **上传音频**：将录制的音频转换为Base64编码
3. **发送请求**：调用 voice_conversation 或 voice_qa_session 工具
4. **收听回复**：收到AI的语音URL，播放语音回复

### 技术参数
- **音频格式**：MP3、WAV、OGG
- **音频时长**：建议1-10秒
- **音频大小**：建议<10MB
- **采样率**：16000Hz或24000Hz
- **响应延迟**：约3-5秒

## 🛠️ 工具选择

### 1. voice_conversation - 通用语音对话
适用：一般性问题咨询
```
voice_conversation(audio_base64="...", speaker_id="student_1")
```

### 2. voice_qa_session - 学科语音问答
适用：特定学科的学术问题
```
voice_qa_session(audio_base64="...", student_id=1, subject="数学")
```

### 3. voice_homework_help - 作业辅导
适用：作业过程中的具体问题
```
voice_homework_help(audio_base64="...", student_id=1, homework_id=1)
```

## 💡 使用建议

### 学生端建议
1. **清晰发音**：说话清晰，避免背景噪音
2. **简洁表达**：一次问一个问题，简明扼要
3. **耐心等待**：等待AI回复完成（约3-5秒）
4. **连续对话**：可以连续多轮对话

### 教师端建议
1. **设置系统提示**：根据不同学科和场景调整提示词
2. **监控对话质量**：检查AI回复是否准确、友好
3. **收集反馈**：收集学生对语音对话的反馈

## ⚠️ 注意事项
- 当前为"近实时"对话，延迟约3-5秒
- 建议在安静环境下使用
- 避免过长的语音输入（建议<10秒）
- 网络质量会影响响应速度

## 🚀 未来优化方向
1. 集成流式语音API，降低延迟至<1秒
2. 实现WebSocket实时连接
3. 支持语音打断功能
4. 添加情绪识别和情感回应
"""
    return guide
