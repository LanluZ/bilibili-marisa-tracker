import sqlite3
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from contextlib import contextmanager


class DatabaseManager:
    """数据库管理器 - 封装所有数据库操作"""
    
    def __init__(self, db_path: str = 'bilibili_videos.db'):
        self.db_path = db_path
    
    @contextmanager
    def get_connection(self):
        """获取数据库连接的上下文管理器"""
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
        finally:
            conn.close()
    
    def init_database(self):
        """初始化数据库表结构"""
        with self.get_connection() as conn:
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
            self._add_column_if_not_exists(cursor, 'videos', 'max_online_count', 'INTEGER DEFAULT 0')
            self._add_column_if_not_exists(cursor, 'videos', 'max_online_time', 'TIMESTAMP')
            
            conn.commit()
    
    def _add_column_if_not_exists(self, cursor, table: str, column: str, column_type: str):
        """安全地添加列（如果不存在）"""
        try:
            cursor.execute(f'ALTER TABLE {table} ADD COLUMN {column} {column_type}')
        except sqlite3.OperationalError:
            pass  # 字段已存在
    
    def save_videos(self, videos: List[Dict], crawl_date: str):
        """批量保存视频数据"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            for video in videos:
                self._save_single_video(cursor, video, crawl_date)
            
            conn.commit()
    
    def _save_single_video(self, cursor, video: Dict, crawl_date: str):
        """保存单个视频数据"""
        try:
            from .utils import parse_online_count  # 导入工具函数
        except ImportError:
            from utils import parse_online_count  # 兼容导入
        
        # 解析在线观看人数
        current_online = parse_online_count(video.get('online_count', '0'))
        bvid = video.get('bvid')
        current_time = datetime.now().isoformat()
        
        # 获取历史最高观看人数
        max_online_count, max_online_time = self._get_or_update_max_online(
            cursor, bvid, current_online, current_time
        )
        
        # 插入或更新视频记录
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
            current_time
        ))
    
    def _get_or_update_max_online(self, cursor, bvid: str, current_online: int, current_time: str) -> Tuple[int, str]:
        """获取或更新最高在线人数记录"""
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
                return current_online, current_time
            else:
                # 保持历史最高记录
                return stored_max, stored_time
        else:
            # 首次记录
            return current_online, current_time
    
    def update_video_online_count(self, bvid: str, online_count: str, crawl_date: str):
        """更新单个视频的在线观看人数"""
        try:
            from .utils import parse_online_count
        except ImportError:
            from utils import parse_online_count
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            try:
                # 解析在线观看人数
                current_online = parse_online_count(online_count)
                current_time = datetime.now().isoformat()
                
                # 获取或更新最高在线人数记录
                max_online_count, max_online_time = self._get_or_update_max_online(
                    cursor, bvid, current_online, current_time
                )
                
                # 更新当天的记录
                cursor.execute('''
                    UPDATE videos 
                    SET online_count = ?, max_online_count = ?, max_online_time = ?, crawl_time = ?
                    WHERE bvid = ? AND crawl_date = ?
                ''', (online_count, max_online_count, max_online_time, current_time, bvid, crawl_date))
                
                conn.commit()
                
            except Exception as e:
                print(f"更新视频 {bvid} 在线人数时出错: {e}")
                raise
    
    def get_videos_by_date(self, date: Optional[str] = None, 
                          sort_by: str = "view_count", 
                          order: str = "desc") -> List[Dict]:
        """根据日期获取视频列表"""
        with self.get_connection() as conn:
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
            query += self._build_order_clause(sort_by, order)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            # 转换为字典列表
            columns = ['id', 'bvid', 'aid', 'cid', 'title', 'pic', 'view_count', 
                      'online_count', 'crawl_date', 'crawl_time', 'max_online_count', 'max_online_time']
            
            return [dict(zip(columns, row)) for row in rows]
    
    def _build_order_clause(self, sort_by: str, order: str) -> str:
        """构建排序子句"""
        order_upper = order.upper()
        
        if sort_by == "online_count":
            return f" ORDER BY CAST(online_count AS INTEGER) {order_upper}"
        elif sort_by == "max_online_count":
            return f" ORDER BY max_online_count {order_upper}"
        elif sort_by == "view_count":
            return f" ORDER BY view_count {order_upper}"
        elif sort_by == "title":
            return f" ORDER BY title {order_upper}"
        else:
            return " ORDER BY view_count DESC"
    
    def get_available_dates(self) -> List[str]:
        """获取可用的爬取日期列表"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT crawl_date FROM videos ORDER BY crawl_date DESC")
            return [row[0] for row in cursor.fetchall()]
    
    def get_videos_to_update(self, crawl_date: str) -> List[Tuple[str, int]]:
        """获取需要更新在线人数的视频列表"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT DISTINCT bvid, cid FROM videos 
                WHERE crawl_date = ? AND bvid IS NOT NULL
                ORDER BY id
            ''', (crawl_date,))
            
            return cursor.fetchall()


# 创建全局数据库管理器实例
db_manager = DatabaseManager()
