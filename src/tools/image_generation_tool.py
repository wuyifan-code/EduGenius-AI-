from langchain.tools import tool
from coze_coding_dev_sdk import ImageGenerationClient
from coze_coding_utils.runtime_ctx.context import new_context


@tool
def generate_chart_image(prompt: str, size: str = "2K") -> str:
    """生成学习图表图片
    
    Args:
        prompt: 图片描述（如：函数图像、几何图形、数据可视化图表等）
        size: 图片尺寸（2K 或 4K），默认2K
    
    Returns:
        生成的图片URL
    """
    try:
        ctx = new_context(method="generate")
        client = ImageGenerationClient(ctx=ctx)
        
        response = client.generate(
            prompt=prompt,
            size=size,
            watermark=False
        )
        
        if not response.success:
            return f"❌ 图片生成失败: {', '.join(response.error_messages)}"
        
        image_urls = response.image_urls
        result = f"✅ 图表生成成功！\n"
        result += f"生成数量: {len(image_urls)}张\n"
        result += f"图片尺寸: {size}\n"
        result += f"图片URL:\n"
        for i, url in enumerate(image_urls, 1):
            result += f"  {i}. {url}\n"
        
        return result
    except Exception as e:
        return f"❌ 生成失败: {str(e)}"


@tool
def generate_diagram(prompt: str, size: str = "2K") -> str:
    """生成教学示意图
    
    Args:
        prompt: 图片描述（如：物理实验图、化学分子结构、生物细胞图等）
        size: 图片尺寸（2K 或 4K），默认2K
    
    Returns:
        生成的图片URL
    """
    try:
        ctx = new_context(method="generate")
        client = ImageGenerationClient(ctx=ctx)
        
        response = client.generate(
            prompt=prompt,
            size=size,
            watermark=False
        )
        
        if not response.success:
            return f"❌ 示意图生成失败: {', '.join(response.error_messages)}"
        
        image_urls = response.image_urls
        result = f"✅ 示意图生成成功！\n"
        result += f"生成数量: {len(image_urls)}张\n"
        result += f"图片尺寸: {size}\n"
        result += f"图片URL:\n"
        for i, url in enumerate(image_urls, 1):
            result += f"  {i}. {url}\n"
        
        return result
    except Exception as e:
        return f"❌ 生成失败: {str(e)}"


@tool
def generate_visual_material(prompt: str, size: str = "2K") -> str:
    """生成教学可视化素材
    
    Args:
        prompt: 图片描述（如：知识点思维导图、流程图、时间线等）
        size: 图片尺寸（2K 或 4K），默认2K
    
    Returns:
        生成的图片URL
    """
    try:
        ctx = new_context(method="generate")
        client = ImageGenerationClient(ctx=ctx)
        
        response = client.generate(
            prompt=prompt,
            size=size,
            watermark=False
        )
        
        if not response.success:
            return f"❌ 可视化素材生成失败: {', '.join(response.error_messages)}"
        
        image_urls = response.image_urls
        result = f"✅ 可视化素材生成成功！\n"
        result += f"生成数量: {len(image_urls)}张\n"
        result += f"图片尺寸: {size}\n"
        result += f"图片URL:\n"
        for i, url in enumerate(image_urls, 1):
            result += f"  {i}. {url}\n"
        
        return result
    except Exception as e:
        return f"❌ 生成失败: {str(e)}"
