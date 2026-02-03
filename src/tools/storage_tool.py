from langchain.tools import tool
from coze_coding_dev_sdk.s3 import S3SyncStorage
import os


@tool
def upload_file_to_storage(content: str, file_name: str, content_type: str = "text/plain") -> str:
    """上传文件到对象存储
    
    Args:
        content: 文件内容
        file_name: 文件名
        content_type: 内容类型（如 text/plain, application/pdf, image/png 等）
    
    Returns:
        上传结果，包含对象key和访问URL
    """
    try:
        storage = S3SyncStorage(
            endpoint_url=os.getenv("COZE_BUCKET_ENDPOINT_URL"),
            access_key="",
            secret_key="",
            bucket_name=os.getenv("COZE_BUCKET_NAME"),
            region="cn-beijing",
        )
        
        file_key = storage.upload_file(
            file_content=content.encode('utf-8'),
            file_name=file_name,
            content_type=content_type
        )
        
        # 生成签名URL
        signed_url = storage.generate_presigned_url(key=file_key, expire_time=3600)
        
        return f"✅ 文件上传成功！\n对象Key: {file_key}\n访问URL: {signed_url}\n有效期: 1小时"
    except Exception as e:
        return f"❌ 上传失败: {str(e)}"


@tool
def download_file_from_storage(file_key: str) -> str:
    """从对象存储下载文件
    
    Args:
        file_key: 对象Key
    
    Returns:
        文件内容
    """
    try:
        storage = S3SyncStorage(
            endpoint_url=os.getenv("COZE_BUCKET_ENDPOINT_URL"),
            access_key="",
            secret_key="",
            bucket_name=os.getenv("COZE_BUCKET_NAME"),
            region="cn-beijing",
        )
        
        file_content = storage.read_file(file_key=file_key)
        decoded_content = file_content.decode('utf-8')
        
        return f"✅ 文件下载成功！\n内容:\n{decoded_content}"
    except Exception as e:
        return f"❌ 下载失败: {str(e)}"


@tool
def delete_file_from_storage(file_key: str) -> str:
    """从对象存储删除文件
    
    Args:
        file_key: 对象Key
    
    Returns:
        删除结果
    """
    try:
        storage = S3SyncStorage(
            endpoint_url=os.getenv("COZE_BUCKET_ENDPOINT_URL"),
            access_key="",
            secret_key="",
            bucket_name=os.getenv("COZE_BUCKET_NAME"),
            region="cn-beijing",
        )
        
        success = storage.delete_file(file_key=file_key)
        if success:
            return f"✅ 文件删除成功！对象Key: {file_key}"
        else:
            return f"❌ 文件删除失败"
    except Exception as e:
        return f"❌ 删除失败: {str(e)}"


@tool
def generate_file_url(file_key: str, expire_hours: int = 1) -> str:
    """生成文件访问URL
    
    Args:
        file_key: 对象Key
        expire_hours: 有效期（小时），默认1小时
    
    Returns:
        访问URL
    """
    try:
        storage = S3SyncStorage(
            endpoint_url=os.getenv("COZE_BUCKET_ENDPOINT_URL"),
            access_key="",
            secret_key="",
            bucket_name=os.getenv("COZE_BUCKET_NAME"),
            region="cn-beijing",
        )
        
        expire_time = expire_hours * 3600
        signed_url = storage.generate_presigned_url(key=file_key, expire_time=expire_time)
        
        return f"✅ URL生成成功！\n访问URL: {signed_url}\n有效期: {expire_hours}小时"
    except Exception as e:
        return f"❌ URL生成失败: {str(e)}"
