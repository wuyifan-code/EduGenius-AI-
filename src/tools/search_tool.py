from langchain.tools import tool
from coze_coding_dev_sdk import SearchClient
from coze_coding_utils.runtime_ctx.context import new_context


@tool
def search_teaching_resources(query: str, count: int = 5) -> str:
    """搜索教学资源
    
    Args:
        query: 搜索关键词
        count: 返回结果数量，默认5
    
    Returns:
        搜索结果
    """
    try:
        ctx = new_context(method="search.web")
        client = SearchClient(ctx=ctx)
        
        response = client.web_search(query=query, count=count, need_summary=True)
        
        if not response.web_items:
            return f"❌ 未找到相关资源"
        
        result = f"🔍 搜索结果（共{len(response.web_items)}条）:\n\n"
        
        for i, item in enumerate(response.web_items, 1):
            result += f"{i}. {item.title}\n"
            result += f"   来源: {item.site_name}\n"
            result += f"   URL: {item.url}\n"
            result += f"   摘要: {item.snippet[:100]}...\n"
            if item.summary:
                result += f"   AI总结: {item.summary}\n"
            result += "\n"
        
        if response.summary:
            result += f"\n📝 AI总结:\n{response.summary}"
        
        return result
    except Exception as e:
        return f"❌ 搜索失败: {str(e)}"


@tool
def search_latest_materials(query: str, time_range: str = "1w") -> str:
    """搜索最新教学材料
    
    Args:
        query: 搜索关键词
        time_range: 时间范围（1d=1天, 1w=1周, 1m=1月），默认1周
    
    Returns:
        搜索结果
    """
    try:
        ctx = new_context(method="search.web")
        client = SearchClient(ctx=ctx)
        
        response = client.search(
            query=query,
            search_type="web",
            count=10,
            time_range=time_range,
            need_summary=True
        )
        
        if not response.web_items:
            return f"❌ 未找到最新材料"
        
        result = f"🆕 最新教学材料（最近{time_range}，共{len(response.web_items)}条）:\n\n"
        
        for i, item in enumerate(response.web_items, 1):
            result += f"{i}. {item.title}\n"
            result += f"   来源: {item.site_name}\n"
            result += f"   发布时间: {item.publish_time or '未知'}\n"
            result += f"   URL: {item.url}\n"
            result += f"   摘要: {item.snippet[:100]}...\n\n"
        
        return result
    except Exception as e:
        return f"❌ 搜索失败: {str(e)}"


@tool
def search_with_summary(query: str, count: int = 5) -> str:
    """搜索并生成AI总结
    
    Args:
        query: 搜索关键词
        count: 返回结果数量，默认5
    
    Returns:
        搜索结果和AI总结
    """
    try:
        ctx = new_context(method="search.web")
        client = SearchClient(ctx=ctx)
        
        response = client.web_search_with_summary(query=query, count=count)
        
        if not response.web_items:
            return f"❌ 未找到相关结果"
        
        result = f"🔍 搜索结果:\n\n"
        
        for i, item in enumerate(response.web_items, 1):
            result += f"{i}. {item.title}\n"
            result += f"   来源: {item.site_name}\n"
            result += f"   URL: {item.url}\n"
            result += f"   摘要: {item.snippet[:100]}...\n\n"
        
        if response.summary:
            result += f"\n📝 AI总结:\n{response.summary}"
        else:
            result += f"\n⚠️ AI总结生成失败"
        
        return result
    except Exception as e:
        return f"❌ 搜索失败: {str(e)}"
