from typing import Optional
from datetime import date

try:
    from fastapi import APIRouter, HTTPException, BackgroundTasks
    from fastapi.responses import Response
    import httpx
except ImportError as e:
    print(f"导入FastAPI相关模块失败: {e}")
    # 创建占位符以避免运行时错误
    class APIRouter:
        def __init__(self, prefix=""):
            self.prefix = prefix
        def get(self, path): 
            def decorator(func): 
                return func
            return decorator
        def post(self, path):
            def decorator(func):
                return func
            return decorator
    
    class HTTPException(Exception):
        def __init__(self, status_code, detail):
            self.status_code = status_code
            self.detail = detail
    
    class BackgroundTasks:
        pass
    
    class Response:
        def __init__(self, content, media_type, headers=None):
            self.content = content
            self.media_type = media_type
            self.headers = headers or {}

try:
    from .database import db_manager
    from .scheduler import task_scheduler, CrawlConfig
    from .api import FastBilibiliAPI
except ImportError:
    from database import db_manager
    from scheduler import task_scheduler, CrawlConfig
    from api import FastBilibiliAPI


# 创建API路由器
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    """API根端点"""
    return {"message": "Bilibili热门视频API服务"}


@api_router.get("/videos")
async def get_videos(
    date: Optional[str] = None,
    sort_by: str = "view_count",  # title, online_count, view_count, max_online_count
    order: str = "desc",  # desc, asc
    main_zone: Optional[str] = None,  # 主分区筛选
    sub_zone: Optional[str] = None   # 子分区筛选
):
    """
    获取视频数据
    
    Args:
        date: 指定日期，格式为YYYY-MM-DD，不指定则返回最新数据
        sort_by: 排序字段
        order: 排序方向
        main_zone: 主分区ID，用于筛选特定主分区的视频
        sub_zone: 子分区ID，用于筛选特定子分区的视频
    """
    try:
        videos = db_manager.get_videos_by_date(date, sort_by, order, main_zone, sub_zone)
        return {"videos": videos, "total": len(videos)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取视频数据失败: {str(e)}")


@api_router.get("/dates")
async def get_available_dates():
    """获取可用的爬取日期列表"""
    try:
        dates = db_manager.get_available_dates()
        return {"dates": dates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取日期列表失败: {str(e)}")


@api_router.post("/crawl/start")
async def start_crawl(background_tasks: BackgroundTasks):
    """手动启动热门视频爬取任务"""
    try:
        result = task_scheduler.trigger_hot_videos_task()
        if result["success"]:
            return {"message": result["message"]}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"启动爬取任务失败: {str(e)}")


@api_router.post("/crawl/update-online")
async def start_update_online(background_tasks: BackgroundTasks):
    """手动启动在线人数更新任务"""
    try:
        result = task_scheduler.trigger_online_count_task()
        if result["success"]:
            return {"message": result["message"]}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"启动在线人数更新任务失败: {str(e)}")


@api_router.get("/crawl/status")
async def get_crawl_status():
    """获取爬虫和调度器状态"""
    try:
        return task_scheduler.get_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取状态失败: {str(e)}")


@api_router.post("/video/update")
async def update_video_info(bvid: str):
    """
    更新数据库中指定视频的详细信息
    """
    try:
        # 检查视频是否存在于数据库中
        if not db_manager.video_exists(bvid):
            raise HTTPException(
                status_code=404, 
                detail=f"数据库中不存在视频 {bvid}，请先通过热门视频爬取添加该视频"
            )
        
        # 检查是否已经有tid_v2数据，如果有则跳过爬取
        if db_manager.video_has_tid_v2(bvid):
            return {
                "message": f"视频 {bvid} 已存在详细分区信息，跳过更新",
                "skipped": True,
                "reason": "已有tid_v2数据"
            }
        
        # 使用快速API获取视频详情（不需要浏览器）
        with FastBilibiliAPI() as fast_api:
            detail = fast_api.get_video_detail(bvid)
            
            if not detail:
                raise HTTPException(
                    status_code=500, 
                    detail=f"无法获取视频 {bvid} 的详细信息，可能是网络问题或视频已被删除"
                )
            
            # 构建更新数据
            from datetime import date
            today = date.today().isoformat()
            
            # 获取统计信息
            stat = detail.get('stat', {})
            
            video_data = {
                'bvid': detail.get('bvid'),
                'aid': detail.get('aid'),
                'cid': detail.get('cid', 0),
                'title': detail.get('title'),
                'pic': detail.get('pic'),
                'view': stat.get('view', 0),
                'online_count': '0',  # 在线人数保持为0，这个由专门的任务更新
                'tid_v2': detail.get('tid_v2'),
                'copyright': detail.get('copyright'),
            }
            
            # 更新数据库
            db_manager.save_videos([video_data], today)
            
            return {
                "message": f"视频 {bvid} 信息更新成功",
                "video_info": {
                    "bvid": detail.get('bvid'),
                    "title": detail.get('title'),
                    "tid_v2": detail.get('tid_v2'),
                    "copyright": detail.get('copyright'),
                    "view_count": stat.get('view', 0),
                    "like_count": stat.get('like', 0),
                    "coin_count": stat.get('coin', 0),
                    "favorite_count": stat.get('favorite', 0),
                    "updated_at": today
                }
            }
            
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        print(f"更新视频 {bvid} 信息时出错: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"更新视频信息失败: {str(e)}")



@api_router.get("/crawl/config")
async def get_crawl_config():
    """获取当前爬虫配置"""
    try:
        config = task_scheduler.get_config()
        return {"config": config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取配置失败: {str(e)}")


@api_router.post("/crawl/config")
async def update_crawl_config(config: CrawlConfig):
    """
    更新爬虫配置
    
    Args:
        config: 新的配置参数
    """
    try:
        task_scheduler.update_config(config)
        return {
            "message": "配置已更新", 
            "config": task_scheduler.get_config()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新配置失败: {str(e)}")


@api_router.get("/proxy/image")
async def proxy_image(url: str):
    """
    代理B站图片，解决防盗链问题
    
    Args:
        url: 图片URL
    """
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                'Referer': 'https://www.bilibili.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return Response(
                    content=response.content,
                    media_type=response.headers.get('content-type', 'image/jpeg'),
                    headers={'Cache-Control': 'max-age=3600'}
                )
            else:
                raise HTTPException(status_code=404, detail="图片不存在")
    except Exception as e:
        print(f"代理图片失败: {e}")
        raise HTTPException(status_code=500, detail="代理图片失败")


@api_router.get("/video/detail")
async def get_video_detail(bvid: Optional[str] = None, aid: Optional[str] = None):
    """获取视频详细信息的代理接口"""
    if not bvid and not aid:
        raise HTTPException(status_code=400, detail="bvid或aid至少需要提供一个")
    
    try:
        # 构建bilibili API请求
        params = {}
        if bvid:
            params['bvid'] = bvid
        elif aid:
            params['aid'] = aid
            
        async with httpx.AsyncClient() as client:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.bilibili.com/',
            }
            
            url = "https://api.bilibili.com/x/web-interface/view"
            response = await client.get(url, params=params, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 0:
                    return data['data']
                else:
                    raise HTTPException(status_code=400, detail=data.get('message', '获取视频信息失败'))
            else:
                raise HTTPException(status_code=response.status_code, detail="请求bilibili API失败")
                
    except Exception as e:
        print(f"获取视频详情失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取视频详情失败: {str(e)}")


# 健康检查端点
@api_router.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "service": "魔理沙的秘密☆书屋",
        "version": "1.0.0"
    }
