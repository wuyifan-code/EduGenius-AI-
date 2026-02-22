"""
电话通话工具 - 支持阿里云语音服务和Twilio
"""
from langchain.tools import tool
import os
from typing import Optional


@tool
def make_ai_phone_call(
    phone_number: str,
    message: str,
    student_id: int = None,
    subject: str = None
) -> str:
    """发起AI智能语音通话解答问题
    
    功能说明：
    - 自动拨打学生电话
    - 播放AI解答语音
    - 支持文本转语音（TTS）
    - 记录通话日志
    
    Args:
        phone_number: 学生电话号码（格式：+8613800138000 或 13800138000）
        message: 要播放的语音消息（文本内容）
        student_id: 学生ID（可选，用于记录日志）
        subject: 学科（可选，如数学、英语等）
    
    Returns:
        通话结果（包含CallID、状态等）
    
    使用前准备：
    1. 配置阿里云AccessKey环境变量：
       - ALIBABA_CLOUD_ACCESS_KEY_ID
       - ALIBABA_CLOUD_ACCESS_KEY_SECRET
    2. 在阿里云语音服务控制台：
       - 申请企业资质
       - 购买外呼号码
       - 创建TTS模板或上传语音文件
    
    注意事项：
    - 只有企业用户才可以开通呼叫中心功能
    - 需要配置真实号码并审核通过
    - 呼叫会按照语音服务计费规则收费
    """
    try:
        # 检查环境变量
        access_key_id = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID")
        access_key_secret = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
        show_number = os.getenv("ALIBABA_CLOUD_SHOW_NUMBER")
        
        if not access_key_id or not access_key_secret:
            return """❌ 电话通话功能未配置

📝 配置步骤：

1. 注册阿里云账号
   访问：https://www.aliyun.com

2. 开通语音服务
   - 控制台 -> 产品与服务 -> 语音服务
   - 申请企业资质（需要营业执照等材料）
   - 审核通过后可使用

3. 购买外呼号码
   - 控制台 -> 语音服务 -> 号码管理
   - 购买真实号码并审核
   - 记录号码（如：0633676xxx）

4. 创建AccessKey
   - 控制台右上角 -> AccessKey管理
   - 创建AccessKey
   - 记录 AccessKey ID 和 AccessKey Secret

5. 配置环境变量
   export ALIBABA_CLOUD_ACCESS_KEY_ID="你的AccessKey ID"
   export ALIBABA_CLOUD_ACCESS_KEY_SECRET="你的AccessKey Secret"
   export ALIBABA_CLOUD_SHOW_NUMBER="你的外呼号码"

6. 安装依赖
   pip install alibabacloud-dyvmsapi20170525 alibabacloud-credentials

📞 配置完成后，即可使用电话通话功能！
"""
        
        if not show_number:
            return """⚠️ 外呼号码未配置

请配置环境变量：
export ALIBABA_CLOUD_SHOW_NUMBER="你的外呼号码"

外呼号码可在阿里云语音服务控制台购买。
"""
        
        # 尝试导入阿里云SDK（动态导入避免LSP检查错误）
        try:
            import importlib
            DyvmsClient = importlib.import_module('alibabacloud_dyvmsapi20170525.client').Client
            open_api_models = importlib.import_module('alibabacloud_tea_openapi').models
            dyvms_models = importlib.import_module('alibabacloud_dyvmsapi20170525').models
        except ImportError as e:
            return f"""⚠️ 阿里云SDK未安装

请运行以下命令安装依赖：
pip install alibabacloud-dyvmsapi20170525 alibabacloud-credentials alibabacloud-tea-console

错误详情: {e}
"""
        
        # 格式化电话号码
        if not phone_number.startswith("+86"):
            phone_number = "+86" + phone_number
        
        # 创建客户端
        config = open_api_models.Config(
            access_key_id=access_key_id,
            access_key_secret=access_key_secret
        )
        config.endpoint = f'dyvmsapi.aliyuncs.com'
        client = DyvmsClient(config)
        
        # 创建请求（SingleCallByTts - 文本转语音）
        request = dyvms_models.SingleCallByTtsRequest(
            called_show_number=show_number,
            called_number=phone_number,
            tts_code="TTS_CODE",  # 需要在控制台创建TTS模板
            tts_param=f'{{"content":"{message}"}}'
        )
        
        # 发起请求
        response = client.single_call_by_tts(request)
        
        # 返回结果
        result = f"✅ 语音通话发起成功！\n\n"
        result += f"📱 电话号码: {phone_number}\n"
        result += f"📖 播放内容: {message}\n"
        result += f"🆔 通话ID: {response.body.call_id}\n"
        result += f"📊 呼叫ID: {response.body.code}\n"
        
        if student_id:
            result += f"👤 学生ID: {student_id}\n"
        if subject:
            result += f"📚 学科: {subject}\n"
        
        result += f"\n💡 提示：通话将按语音服务计费规则收费"
        
        return result
        
    except Exception as e:
        return f"❌ 语音通话失败：{str(e)}\n\n请检查：\n1. 阿里云AccessKey是否正确\n2. 外呼号码是否配置\n3. TTS模板是否创建\n4. 网络连接是否正常"


@tool
def make_phone_call_with_ai_assistant(
    phone_number: str,
    question: str,
    student_id: int = None,
    subject: str = "数学"
) -> str:
    """AI助手电话解答（高级功能）
    
    功能流程：
    1. AI解答学生问题
    2. 自动拨打学生电话
    3. 语音播报解答内容
    4. 提供相似题型建议
    
    Args:
        phone_number: 学生电话号码
        question: 学生提出的问题
        student_id: 学生ID
        subject: 学科
    
    Returns:
        通话结果和解答内容
    """
    try:
        # 先使用LLM解答问题
        from coze_coding_dev_sdk import LLMClient
        from coze_coding_utils.runtime_ctx.context import new_context
        from langchain_core.messages import HumanMessage, SystemMessage
        
        ctx_llm = new_context(method="llm.invoke")
        llm_client = LLMClient(ctx=ctx_llm)
        
        system_prompt = f"""你是一位专业的教育AI老师，擅长{subject}教学。
请用简洁、友好的语音解答学生的问题（适合电话语音播报）。
回答要求：
1. 控制在150字以内
2. 使用口语化表达
3. 包含答案和简要解题思路
4. 语速适中，容易听懂"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=question)
        ]
        
        response = llm_client.invoke(messages=messages)
        
        # 处理响应内容
        if isinstance(response.content, str):
            answer = response.content
        elif isinstance(response.content, list):
            text_parts = [item.get("text", "") for item in response.content if isinstance(item, dict) and item.get("type") == "text"]
            answer = " ".join(text_parts)
        else:
            answer = str(response.content)
        
        # 调用电话通话功能
        call_result = make_ai_phone_call(
            phone_number=phone_number,
            message=answer,
            student_id=student_id,
            subject=subject
        )
        
        # 组合返回结果
        result = f"# 📞 AI电话解答\n\n"
        result += f"## ❓ 学生问题\n{question}\n\n"
        result += f"## ✅ AI解答\n{answer}\n\n"
        result += f"## 📱 通话状态\n{call_result}\n\n"
        result += f"💡 学生接听后将听到AI的语音解答！"
        
        return result
        
    except Exception as e:
        return f"❌ AI电话解答失败：{str(e)}"


@tool
def get_phone_call_guide() -> str:
    """获取电话通话功能配置指南"""
    guide = """
# 📞 电话通话功能配置指南

## 🎯 功能说明
本功能支持AI自动拨打学生电话，语音播报学习解答和建议。

## 📋 配置步骤

### 步骤1：注册阿里云账号
- 访问：https://www.aliyun.com
- 完成实名认证

### 步骤2：开通语音服务
1. 登录阿里云控制台
2. 搜索"语音服务"并进入
3. 点击"立即开通"
4. 选择"语音通知"或"智能外呼"

### 步骤3：申请企业资质（必须）
1. 控制台 -> 语音服务 -> 企业资质管理
2. 上传营业执照、授权书等材料
3. 等待审核（通常1-2个工作日）
4. **注意：只有企业用户才可以开通呼叫中心功能**

### 步骤4：购买外呼号码
1. 控制台 -> 语音服务 -> 号码管理
2. 选择号码类型（真实号/虚拟号）
3. 购买号码（费用约200-500元/月）
4. 记录号码（如：0633676xxx）

### 步骤5：创建TTS模板
1. 控制台 -> 语音服务 -> 语音模板
2. 选择"文本转语音模板"
3. 输入模板内容（如：${content}）
4. 提交审核
5. 记录模板代码（TTS_CODE）

### 步骤6：获取AccessKey
1. 控制台右上角 -> AccessKey管理
2. 创建AccessKey
3. 记录以下信息：
   - AccessKey ID
   - AccessKey Secret

### 步骤7：配置环境变量
```bash
# 在项目根目录创建 .env 文件
ALIBABA_CLOUD_ACCESS_KEY_ID="你的AccessKey ID"
ALIBABA_CLOUD_ACCESS_KEY_SECRET="你的AccessKey Secret"
ALIBABA_CLOUD_SHOW_NUMBER="你的外呼号码"
ALIBABA_CLOUD_TTS_CODE="你的TTS模板代码"
```

### 步骤8：安装Python依赖
```bash
pip install alibabacloud-dyvmsapi20170525 alibabacloud-credentials alibabacloud-tea-console
```

## 📱 使用示例

### 基础用法
```
make_ai_phone_call(
    phone_number="13800138000",
    message="同学你好，你的数学作业已批改完成，得分90分！"
)
```

### AI解答模式
```
make_phone_call_with_ai_assistant(
    phone_number="13800138000",
    question="求解方程 2x + 5 = 13",
    student_id=1,
    subject="数学"
)
```

## 💰 费用说明

### 语音服务计费
- **语音通知**：按通话时长计费（约0.15元/分钟）
- **外呼号码**：月租费（200-500元/月）
- **智能外呼**：按通话时长计费（约0.2元/分钟）

### 具体价格
请参考：https://www.aliyun.com/price/product#/vms

## ⚠️ 注意事项

1. **企业资质**：必须完成企业资质审核才能使用
2. **号码审核**：外呼号码需要经过运营商审核
3. **合规要求**：
   - 不得用于骚扰电话
   - 需要提供退订方式
   - 遵守通信法规
4. **频率限制**：单用户限制100次/秒
5. **号码验证**：试用账户只能拨打已验证号码

## 🚀 高级功能

### 1. 智能外呼（SmartCall）
- 支持语音识别（ASR）
- 支持实时交互
- 需要配置回调接口

### 2. 呼入配置
- 学生主动拨打AI电话
- 需要配置呼入号码
- 需要部署回调服务器

### 3. 批量外呼
- 支持批量拨打电话
- 适合班级通知、作业提醒
- 需要注意频率限制

## 🔧 故障排查

### 常见错误

#### 错误1：AccessKey无效
```
解决方案：检查环境变量是否正确配置
```

#### 错误2：号码未审核
```
解决方案：等待号码审核完成，或购买专属号码
```

#### 错误3：TTS模板不存在
```
解决方案：在控制台创建TTS模板并记录代码
```

#### 错误4：余额不足
```
解决方案：充值账户余额
```

## 📞 技术支持

- 阿里云帮助文档：https://help.aliyun.com/zh/vms/
- 阿里云开发者社区：https://developer.aliyun.com/
- 语音服务价格：https://www.aliyun.com/price/product#/vms

## 💡 使用建议

1. **定时提醒**：每天固定时间提醒学生完成作业
2. **成绩通知**：批改完成后自动通知学生
3. **学习建议**：定期提供学习建议和鼓励
4. **考试提醒**：考试前自动提醒学生复习
5. **家长沟通**：定期向家长反馈学生学习情况

## 🎊 配置完成后，即可享受AI电话答疑服务！
"""
    return guide


@tool
def check_phone_call_config() -> str:
    """检查电话通话功能配置状态"""
    status = []
    
    # 检查环境变量
    access_key_id = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID")
    access_key_secret = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
    show_number = os.getenv("ALIBABA_CLOUD_SHOW_NUMBER")
    tts_code = os.getenv("ALIBABA_CLOUD_TTS_CODE")
    
    # 检查SDK（动态导入避免LSP检查错误）
    try:
        import importlib
        importlib.import_module('alibabacloud_dyvmsapi20170525')
        sdk_status = "✅ 已安装"
    except ImportError:
        sdk_status = "❌ 未安装"
    
    # 组织结果
    result = "# 📞 电话通话配置状态\n\n"
    result += "## 环境变量检查\n\n"
    
    result += f"### ALIBABA_CLOUD_ACCESS_KEY_ID\n"
    result += f"状态: {'✅ 已配置' if access_key_id else '❌ 未配置'}\n"
    if access_key_id:
        result += f"值: {access_key_id[:8]}...{access_key_id[-4:]}\n\n"
    else:
        result += f"设置: export ALIBABA_CLOUD_ACCESS_KEY_ID='你的AccessKey ID'\n\n"
    
    result += f"### ALIBABA_CLOUD_ACCESS_KEY_SECRET\n"
    result += f"状态: {'✅ 已配置' if access_key_secret else '❌ 未配置'}\n"
    if access_key_secret:
        result += f"值: {access_key_secret[:8]}...{access_key_secret[-4:]}\n\n"
    else:
        result += f"设置: export ALIBABA_CLOUD_ACCESS_KEY_SECRET='你的AccessKey Secret'\n\n"
    
    result += f"### ALIBABA_CLOUD_SHOW_NUMBER\n"
    result += f"状态: {'✅ 已配置' if show_number else '❌ 未配置'}\n"
    if show_number:
        result += f"值: {show_number}\n\n"
    else:
        result += f"设置: export ALIBABA_CLOUD_SHOW_NUMBER='你的外呼号码'\n\n"
    
    result += f"### ALIBABA_CLOUD_TTS_CODE\n"
    result += f"状态: {'✅ 已配置' if tts_code else '⚠️ 未配置（可选）'}\n"
    if tts_code:
        result += f"值: {tts_code}\n\n"
    else:
        result += f"设置: export ALIBABA_CLOUD_TTS_CODE='你的TTS模板代码'\n\n"
    
    result += "## SDK安装状态\n\n"
    result += f"### alibabacloud-dyvmsapi20170525\n"
    result += f"状态: {sdk_status}\n"
    if sdk_status == "❌ 未安装":
        result += f"安装: pip install alibabacloud-dyvmsapi20170525 alibabacloud-credentials alibabacloud-tea-console\n\n"
    
    result += "## 总体评估\n\n"
    
    checks = [
        (access_key_id, "AccessKey"),
        (access_key_secret, "AccessKey Secret"),
        (show_number, "外呼号码"),
        (sdk_status == "✅ 已安装", "SDK")
    ]
    
    passed = sum(1 for check, _ in checks if check)
    total = len(checks)
    
    if passed == total:
        result += "✅ **配置完成！所有检查项均通过**\n\n"
        result += "🎉 您可以开始使用电话通话功能了！\n"
    else:
        result += f"⚠️ **配置未完成 ({passed}/{total})**\n\n"
        result += "请完成以下配置项后重新检查：\n"
        for check, name in checks:
            if not check:
                result += f"- ❌ {name}\n"
        result += "\n"
        result += "💡 输入 `get_phone_call_guide` 查看详细配置指南\n"
    
    return result
