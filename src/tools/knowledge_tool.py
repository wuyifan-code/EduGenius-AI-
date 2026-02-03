from langchain.tools import tool
from coze_coding_dev_sdk import KnowledgeClient, Config, KnowledgeDocument
from coze_coding_dev_sdk.knowledge import DataSourceType
from coze_coding_utils.runtime_ctx.context import new_context


@tool
def add_to_knowledge_base(content: str, title: str, subject: str = None) -> str:
    """添加教学内容到知识库
    
    Args:
        content: 教学内容
        title: 内容标题
        subject: 学科（可选）
    
    Returns:
        添加结果
    """
    try:
        ctx = new_context(method="knowledge.add")
        config = Config()
        client = KnowledgeClient(config=config, ctx=ctx)
        
        doc = KnowledgeDocument(
            source=DataSourceType.TEXT,
            raw_data=content,
        )
        
        # 使用默认知识库表
        response = client.add_documents(documents=[doc], table_name="coze_doc_knowledge")
        
        if response.code == 0:
            return f"✅ 内容添加成功！\n标题: {title}\n学科: {subject or '通用'}\n文档ID: {response.doc_ids[0]}"
        else:
            return f"❌ 添加失败: {response.msg}"
    except Exception as e:
        return f"❌ 添加失败: {str(e)}"


@tool
def add_url_to_knowledge_base(url: str, title: str, subject: str = None) -> str:
    """从URL添加教学内容到知识库
    
    Args:
        url: 内容URL
        title: 内容标题
        subject: 学科（可选）
    
    Returns:
        添加结果
    """
    try:
        ctx = new_context(method="knowledge.add")
        config = Config()
        client = KnowledgeClient(config=config, ctx=ctx)
        
        doc = KnowledgeDocument(
            source=DataSourceType.URL,
            url=url,
        )
        
        response = client.add_documents(documents=[doc], table_name="coze_doc_knowledge")
        
        if response.code == 0:
            return f"✅ URL内容添加成功！\n标题: {title}\nURL: {url}\n学科: {subject or '通用'}\n文档ID: {response.doc_ids[0]}"
        else:
            return f"❌ 添加失败: {response.msg}"
    except Exception as e:
        return f"❌ 添加失败: {str(e)}"


@tool
def search_knowledge_base(query: str, top_k: int = 5) -> str:
    """从知识库搜索教学内容
    
    Args:
        query: 搜索关键词
        top_k: 返回结果数量，默认5
    
    Returns:
        搜索结果
    """
    try:
        ctx = new_context(method="knowledge.search")
        config = Config()
        client = KnowledgeClient(config=config, ctx=ctx)
        
        response = client.search(query=query, top_k=top_k)
        
        if response.code != 0:
            return f"❌ 搜索失败: {response.msg}"
        
        if not response.chunks:
            return f"❌ 未找到相关内容"
        
        result = f"🔍 知识库搜索结果（共{len(response.chunks)}条）:\n\n"
        
        for i, chunk in enumerate(response.chunks, 1):
            result += f"{i}. [相关度: {chunk.score:.4f}]\n"
            result += f"   内容: {chunk.content[:200]}...\n"
            if chunk.doc_id:
                result += f"   文档ID: {chunk.doc_id}\n"
            result += "\n"
        
        return result
    except Exception as e:
        return f"❌ 搜索失败: {str(e)}"
