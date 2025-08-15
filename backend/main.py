import threading
from contextlib import asynccontextmanager

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
except ImportError as e:
    print(f"导入FastAPI失败: {e}")
    FastAPI = None
    CORSMiddleware = None

# 导入模块化组件
try:
    from .database import db_manager
    from .scheduler import task_scheduler
    from .routes import api_router
except ImportError:
    from database import db_manager
    from scheduler import task_scheduler
    from routes import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    print("正在初始化应用...")
    
    # 初始化数据库
    db_manager.init_database()
    print("数据库初始化完成")
    
    # 启动调度器
    task_scheduler.start()
    print("调度器已启动")
    
    # 立即执行一次热门视频爬取
    result = task_scheduler.trigger_hot_videos_task()
    if result["success"]:
        print("首次热门视频爬取任务已启动")
    
    print("应用启动完成")
    
    yield
    
    # 关闭时执行
    print("正在关闭应用...")
    task_scheduler.stop()
    print("调度器已停止")
    print("应用已关闭")


def create_app() -> FastAPI:
    """创建FastAPI应用实例"""
    app = FastAPI(
        title="魔理沙的秘密☆书屋", 
        version="1.0.0", 
        description="B站热门视频追踪系统",
        lifespan=lifespan
    )
    
    # 添加CORS中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 生产环境中应该指定具体域名
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 注册API路由
    app.include_router(api_router)
    
    return app


# 创建应用实例
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
