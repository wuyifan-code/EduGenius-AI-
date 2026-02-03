from langchain.tools import tool
from coze_coding_dev_sdk import TTSClient, ASRClient
from coze_coding_utils.runtime_ctx.context import new_context
import base64


@tool
def text_to_speech(text: str, speaker: str = "zh_female_xiaohe_uranus_bigtts") -> str:
    """将文本转换为语音（TTS）
    
    Args:
        text: 要转换的文本
        speaker: 说话人ID（可选，默认为女声）
    
    Returns:
        生成的音频URL
    """
    try:
        ctx = new_context(method="tts.synthesize")
        client = TTSClient(ctx=ctx)
        
        audio_url, audio_size = client.synthesize(
            uid="education_agent",
            text=text,
            speaker=speaker
        )
        
        return f"✅ 语音合成成功！\n音频URL: {audio_url}\n文件大小: {audio_size} 字节\n提示: 该URL有效期为一段时间，建议尽快下载"
    except Exception as e:
        return f"❌ 语音合成失败: {str(e)}"


@tool
def speech_to_text(audio_url: str) -> str:
    """将语音转换为文本（ASR）
    
    Args:
        audio_url: 音频文件URL
    
    Returns:
        识别的文本
    """
    try:
        ctx = new_context(method="asr.recognize")
        client = ASRClient(ctx=ctx)
        
        text, data = client.recognize(
            uid="education_agent",
            url=audio_url
        )
        
        result = f"✅ 语音识别成功！\n识别文本: {text}\n"
        
        result_data = data.get("result", {})
        duration = result_data.get("duration")
        if duration:
            result += f"音频时长: {duration / 1000:.1f} 秒\n"
        
        return result
    except Exception as e:
        return f"❌ 语音识别失败: {str(e)}"


@tool
def generate_lesson_audio(content: str) -> str:
    """生成课程讲解音频
    
    Args:
        content: 课程内容
    
    Returns:
        生成的音频URL
    """
    try:
        ctx = new_context(method="tts.synthesize")
        client = TTSClient(ctx=ctx)
        
        audio_url, audio_size = client.synthesize(
            uid="education_agent",
            text=content,
            speaker="zh_male_dayi_saturn_bigtts",  # 使用适合讲解的男声
            speech_rate=-10  # 稍微慢一点，适合讲解
        )
        
        return f"✅ 课程音频生成成功！\n音频URL: {audio_url}\n文件大小: {audio_size} 字节\n提示: 使用男声讲解，语速适中"
    except Exception as e:
        return f"❌ 音频生成失败: {str(e)}"


@tool
def generate_storytelling_audio(content: str) -> str:
    """生成故事讲述音频（适合儿童）
    
    Args:
        content: 故事内容
    
    Returns:
        生成的音频URL
    """
    try:
        ctx = new_context(method="tts.synthesize")
        client = TTSClient(ctx=ctx)
        
        audio_url, audio_size = client.synthesize(
            uid="education_agent",
            text=content,
            speaker="zh_female_xueayi_saturn_bigtts",  # 使用儿童故事专用声音
            speech_rate=-20  # 更慢，适合儿童
        )
        
        return f"✅ 故事音频生成成功！\n音频URL: {audio_url}\n文件大小: {audio_size} 字节\n提示: 使用儿童故事专用声音"
    except Exception as e:
        return f"❌ 音频生成失败: {str(e)}"
