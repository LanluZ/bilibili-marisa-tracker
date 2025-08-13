import sqlite3
import json
import threading
import time
import os
from datetime import datetime, date
from typing import List, Dict, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

# 兼容不同的执行方式
try:
    from api import BilibiliSpider  # 当在 backend 目录下运行时
except ImportError:
    from backend.api import BilibiliSpider  # 当在项目根目录运行时

import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    init_database()
    
    # 启动定时爬虫
    global crawler_thread
    crawler_thread = threading.Thread(target=start_scheduler, daemon=True)
    crawler_thread.start()
    
    # 立即执行一次爬取
    threading.Thread(target=crawl_hot_videos, daemon=True).start()
    
    yield
    
    # 关闭时执行（如果需要的话）
    global stop_scheduler
    stop_scheduler = True

app = FastAPI(title="魔理沙的秘密☆书屋", version="1.0.0", lifespan=lifespan)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应该指定具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库模型
class VideoData(BaseModel):
    bvid: Optional[str] = None
    aid: Optional[int] = None
    cid: int
    title: str
    pic: str
    view: int
    online_count: str
    max_online_count: int = 0
    max_online_time: Optional[str] = None
    crawl_date: str

class CrawlConfig(BaseModel):
    max_videos: int = 100
    interval_minutes: int = 60

# 全局配置
crawl_config = CrawlConfig()
crawler_thread = None
is_crawling = False
stop_scheduler = False

def init_database():
    """初始化数据库"""
    conn = sqlite3.connect('bilibili_videos.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bvid TEXT,
            aid INTEGER,
            cid INTEGER,
            title TEXT NOT NULL,
            pic TEXT,
            view_count INTEGER,
            online_count TEXT,
            max_online_count INTEGER DEFAULT 0,
            max_online_time TIMESTAMP,
            crawl_date TEXT NOT NULL,
            crawl_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(bvid, crawl_date) ON CONFLICT REPLACE
        )
    ''')
    
    # 为已存在的表添加新字段（如果不存在）
    try:
        cursor.execute('ALTER TABLE videos ADD COLUMN max_online_count INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass  # 字段已存在
    
    try:
        cursor.execute('ALTER TABLE videos ADD COLUMN max_online_time TIMESTAMP')
    except sqlite3.OperationalError:
        pass  # 字段已存在
    
    conn.commit()
    conn.close()

def save_videos_to_db(videos: List[Dict], crawl_date: str):
    conn = sqlite3.connect('bilibili_videos.db')
    cursor = conn.cursor()
    
    for video in videos:
        # 处理在线观看人数，支持中文"万"字符和"+"号
        online_count_str = str(video.get('online_count', '0'))
        try:
            # 移除+号
            if '+' in online_count_str:
                online_count_str = online_count_str.replace('+', '')
            
            # 处理万字符
            if '万' in online_count_str:
                number_part = online_count_str.split('万')[0]
                current_online = int(float(number_part) * 10000)
            else:
                current_online = int(float(online_count_str))
        except (ValueError, TypeError):
            print(f"无法解析观看人数: {video.get('online_count')} -> 使用默认值0")
            current_online = 0
            
        bvid = video.get('bvid')
        current_time = datetime.now().isoformat()
        
        # 查询当前视频的历史最高观看人数
        cursor.execute('''
            SELECT max_online_count, max_online_time 
            FROM videos 
            WHERE bvid = ? 
            ORDER BY max_online_count DESC 
            LIMIT 1
        ''', (bvid,))
        
        result = cursor.fetchone()
        
        if result and result[0] is not None:
            stored_max = result[0]
            stored_time = result[1]
            
            if current_online > stored_max:
                # 当前观看人数创新高
                max_online_count = current_online
                max_online_time = current_time
            else:
                # 保持历史最高记录
                max_online_count = stored_max
                max_online_time = stored_time
        else:
            # 首次记录
            max_online_count = current_online
            max_online_time = current_time
        
        cursor.execute('''
            INSERT OR REPLACE INTO videos 
            (bvid, aid, cid, title, pic, view_count, online_count, max_online_count, max_online_time, crawl_date, crawl_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            video.get('bvid'),
            video.get('aid'),
            video.get('cid'),
            video['title'],
            video.get('pic'),
            video.get('view'),
            video.get('online_count'),  # 保持原始字符串格式用于显示
            max_online_count,           # 存储数字格式用于比较
            max_online_time,
            crawl_date,
            current_time  # 添加当前爬取时间
        ))
    
    conn.commit()
    conn.close()

def crawl_hot_videos():
    """爬取热门视频数据"""
    global is_crawling
    if is_crawling:
        print("爬虫正在运行中，跳过本次任务")
        return
    
    is_crawling = True
    try:
        print(f"开始爬取热门视频，时间: {datetime.now()}")
        print(f"当前工作目录: {os.getcwd()}")
        print("正在初始化爬虫...")
        import sys
        sys.stdout.flush()  # 强制刷新输出
        
        with BilibiliSpider(headless=True) as spider:
            print("爬虫初始化成功，开始获取热门视频列表")
            sys.stdout.flush()
            # 获取热门视频列表
            videos = spider.get_hot_videos(max_videos=crawl_config.max_videos)
            print(f"获取到 {len(videos)} 个热门视频")
            sys.stdout.flush()
            
            # 获取每个视频的在线观看人数
            for i, video in enumerate(videos):
                try:
                    if video.get('bvid'):
                        print(f"正在获取视频 {video.get('bvid')} 的在线人数...")
                        sys.stdout.flush()
                        online_count = spider.get_online_total(video['bvid'], video.get('cid', -1))
                        video['online_count'] = str(online_count)
                    else:
                        video['online_count'] = "0"
                    print(f"处理进度: {i+1}/{len(videos)}")
                    sys.stdout.flush()
                except Exception as e:
                    print(f"获取视频 {video.get('bvid', video.get('aid'))} 在线人数失败: {e}")
                    video['online_count'] = "0"
                    sys.stdout.flush()
            
            # 保存到数据库
            today = date.today().isoformat()
            save_videos_to_db(videos, today)
            print(f"成功保存 {len(videos)} 个视频数据到数据库")
            sys.stdout.flush()
            
    except Exception as e:
        print(f"爬虫任务执行失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        is_crawling = False

def start_scheduler():
    """启动定时任务"""
    global stop_scheduler
    while not stop_scheduler:
        try:
            time.sleep(30)  # 每分钟检查一次
            current_time = time.time()
            
            # 检查是否到了执行时间（以分钟为单位）
            if hasattr(start_scheduler, 'last_run'):
                time_diff = current_time - start_scheduler.last_run
                if time_diff >= crawl_config.interval_minutes * 60:
                    crawl_hot_videos()
                    start_scheduler.last_run = current_time
            else:
                # 首次运行
                start_scheduler.last_run = current_time
                
        except Exception as e:
            print(f"调度器出错: {e}")
            time.sleep(60)

@app.get("/")
async def root():
    return {"message": "Bilibili热门视频API服务"}

@app.get("/videos")
async def get_videos(
    date: Optional[str] = None,
    sort_by: str = "view_count",  # title, online_count, view_count
    order: str = "desc"  # desc, asc
):
    """获取视频数据"""
    conn = sqlite3.connect('bilibili_videos.db')
    cursor = conn.cursor()
    
    # 构建查询语句
    if date:
        query = "SELECT * FROM videos WHERE crawl_date = ?"
        params = (date,)
    else:
        # 获取最新日期的数据
        query = '''
            SELECT * FROM videos 
            WHERE crawl_date = (SELECT MAX(crawl_date) FROM videos)
        '''
        params = ()
    
    # 添加排序
    if sort_by == "online_count":
        query += f" ORDER BY CAST(online_count AS INTEGER) {order.upper()}"
    elif sort_by == "max_online_count":
        query += f" ORDER BY max_online_count {order.upper()}"
    elif sort_by == "view_count":
        query += f" ORDER BY view_count {order.upper()}"
    elif sort_by == "title":
        query += f" ORDER BY title {order.upper()}"
    else:
        query += " ORDER BY view_count DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    # 转换为字典列表
    columns = ['id', 'bvid', 'aid', 'cid', 'title', 'pic', 'view_count', 'online_count', 'crawl_date', 'crawl_time', 'max_online_count', 'max_online_time']
    videos = []
    for row in rows:
        video = dict(zip(columns, row))
        videos.append(video)
    
    return {"videos": videos, "total": len(videos)}

@app.get("/dates")
async def get_available_dates():
    """获取可用的爬取日期列表"""
    conn = sqlite3.connect('bilibili_videos.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT crawl_date FROM videos ORDER BY crawl_date DESC")
    dates = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    return {"dates": dates}

@app.post("/crawl/start")
async def start_crawl(background_tasks: BackgroundTasks):
    """手动启动爬取任务"""
    if is_crawling:
        raise HTTPException(status_code=400, detail="爬虫正在运行中")
    
    background_tasks.add_task(crawl_hot_videos)
    return {"message": "爬取任务已启动"}

@app.get("/crawl/status")
async def get_crawl_status():
    """获取爬虫状态"""
    return {
        "is_crawling": is_crawling,
        "config": crawl_config.model_dump()
    }

@app.get("/crawl/config")
async def get_crawl_config():
    """获取当前爬虫配置"""
    return {"config": crawl_config.model_dump()}

@app.post("/crawl/config")
async def update_crawl_config(config: CrawlConfig):
    """更新爬虫配置"""
    global crawl_config
    crawl_config = config
    
    # 重置计时器
    if hasattr(start_scheduler, 'last_run'):
        start_scheduler.last_run = time.time()
    
    return {"message": "配置已更新", "config": crawl_config.model_dump()}

@app.get("/proxy/image")
async def proxy_image(url: str):
    """代理B站图片，解决防盗链问题"""
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
