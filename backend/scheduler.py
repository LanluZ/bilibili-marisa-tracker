import time
import threading
from datetime import datetime
from typing import Dict, Any

try:
    from pydantic import BaseModel
except ImportError:
    # 如果没有pydantic，使用简单的类替代
    class BaseModel:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)
        
        def model_dump(self):
            return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}

try:
    from .crawler import crawler_service
except ImportError:
    from crawler import crawler_service


class CrawlConfig(BaseModel):
    """爬虫配置模型"""
    max_videos: int = 100
    interval_minutes: int = 60


class TaskScheduler:
    """任务调度器 - 负责管理定时任务"""
    
    def __init__(self):
        self.stop_scheduler = False
        self.crawler_thread = None
        self.config = CrawlConfig()
        
        # 任务执行时间记录
        self.last_hot_videos_run = 0
        self.last_online_count_run = 0
        
        # 配置参数
        self.check_interval = 30  # 每30秒检查一次
        self.online_count_interval = 5 * 60  # 5分钟更新一次在线人数
    
    def start(self):
        """启动调度器"""
        if self.crawler_thread and self.crawler_thread.is_alive():
            print("调度器已经在运行中")
            return
        
        self.stop_scheduler = False
        self.crawler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.crawler_thread.start()
        print("调度器已启动")
    
    def stop(self):
        """停止调度器"""
        self.stop_scheduler = True
        if self.crawler_thread:
            self.crawler_thread.join(timeout=5)
        print("调度器已停止")
    
    def _run_scheduler(self):
        """调度器主循环"""
        print("调度器开始运行")
        
        while not self.stop_scheduler:
            try:
                time.sleep(self.check_interval)
                current_time = time.time()
                
                # 检查是否需要爬取热门视频
                if self._should_run_hot_videos_task(current_time):
                    self._run_hot_videos_task(current_time)
                
                # 检查是否需要更新在线人数
                if self._should_run_online_count_task(current_time):
                    self._run_online_count_task(current_time)
                    
            except Exception as e:
                print(f"调度器出错: {e}")
                time.sleep(60)  # 出错后等待更长时间
    
    def _should_run_hot_videos_task(self, current_time: float) -> bool:
        """判断是否应该运行热门视频爬取任务"""
        interval_seconds = self.config.interval_minutes * 60
        return current_time - self.last_hot_videos_run >= interval_seconds
    
    def _should_run_online_count_task(self, current_time: float) -> bool:
        """判断是否应该运行在线人数更新任务"""
        return current_time - self.last_online_count_run >= self.online_count_interval
    
    def _run_hot_videos_task(self, current_time: float):
        """运行热门视频爬取任务"""
        print(f"开始爬取热门视频任务...")
        try:
            success = crawler_service.crawl_hot_videos(self.config.max_videos)
            if success:
                self.last_hot_videos_run = current_time
                print(f"热门视频爬取任务完成")
            else:
                print(f"热门视频爬取任务失败")
        except Exception as e:
            print(f"热门视频爬取任务异常: {e}")
    
    def _run_online_count_task(self, current_time: float):
        """运行在线人数更新任务"""
        print(f"开始更新在线人数任务...")
        try:
            success = crawler_service.update_online_counts()
            if success:
                self.last_online_count_run = current_time
                print(f"在线人数更新任务完成")
            else:
                print(f"在线人数更新任务失败")
        except Exception as e:
            print(f"在线人数更新任务异常: {e}")
    
    def update_config(self, new_config: CrawlConfig):
        """更新配置"""
        self.config = new_config
        # 重置热门视频任务计时器，以便新配置立即生效
        self.last_hot_videos_run = 0
        print(f"调度器配置已更新: {new_config.model_dump()}")
    
    def get_config(self) -> Dict[str, Any]:
        """获取当前配置"""
        return self.config.model_dump()
    
    def get_status(self) -> Dict[str, Any]:
        """获取调度器状态"""
        current_time = time.time()
        
        return {
            "is_running": not self.stop_scheduler and self.crawler_thread and self.crawler_thread.is_alive(),
            "config": self.get_config(),
            "crawler_status": crawler_service.get_status(),
            "last_hot_videos_run": datetime.fromtimestamp(self.last_hot_videos_run).isoformat() if self.last_hot_videos_run > 0 else None,
            "last_online_count_run": datetime.fromtimestamp(self.last_online_count_run).isoformat() if self.last_online_count_run > 0 else None,
            "next_hot_videos_run": datetime.fromtimestamp(self.last_hot_videos_run + self.config.interval_minutes * 60).isoformat() if self.last_hot_videos_run > 0 else "立即执行",
            "next_online_count_run": datetime.fromtimestamp(self.last_online_count_run + self.online_count_interval).isoformat() if self.last_online_count_run > 0 else "立即执行"
        }
    
    def trigger_hot_videos_task(self):
        """手动触发热门视频爬取任务"""
        if crawler_service.is_crawling:
            return {"success": False, "message": "爬虫正在运行中"}
        
        # 在后台线程中执行，避免阻塞API响应
        def run_task():
            success = crawler_service.crawl_hot_videos(self.config.max_videos)
            if success:
                self.last_hot_videos_run = time.time()
        
        threading.Thread(target=run_task, daemon=True).start()
        return {"success": True, "message": "热门视频爬取任务已启动"}
    
    def trigger_online_count_task(self):
        """手动触发在线人数更新任务"""
        if crawler_service.is_crawling:
            return {"success": False, "message": "爬虫正在运行中"}
        
        # 在后台线程中执行，避免阻塞API响应
        def run_task():
            success = crawler_service.update_online_counts()
            if success:
                self.last_online_count_run = time.time()
        
        threading.Thread(target=run_task, daemon=True).start()
        return {"success": True, "message": "在线人数更新任务已启动"}


# 创建全局调度器实例
task_scheduler = TaskScheduler()
