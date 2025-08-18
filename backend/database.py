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
            
            # 检查表是否存在
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='videos'")
            table_exists = cursor.fetchone() is not None
            
            if not table_exists:
                # 如果表不存在，创建包含所有字段的完整表结构
                cursor.execute('''
                    CREATE TABLE videos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        bvid TEXT,
                        aid INTEGER,
                        cid INTEGER,
                        title TEXT NOT NULL,
                        pic TEXT,
                        view_count INTEGER,
                        online_count TEXT,
                        crawl_date TEXT NOT NULL,
                        crawl_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        max_online_count INTEGER DEFAULT 0,
                        max_online_time TIMESTAMP,
                        tid_v2 INTEGER,
                        copyright INTEGER,
                        UNIQUE(bvid, crawl_date) ON CONFLICT REPLACE
                    )
                ''')
            else:
                # 表已存在，检查并添加缺失的字段
                cursor.execute("PRAGMA table_info(videos)")
                existing_columns = {col[1] for col in cursor.fetchall()}
                
                # 需要的字段列表
                required_columns = {
                    'max_online_count': 'INTEGER DEFAULT 0',
                    'max_online_time': 'TIMESTAMP',
                    'tid_v2': 'INTEGER',  # 新增分区tid_v2字段
                    'copyright': 'INTEGER'  # 新增视频类型字段 (1:原创, 2:转载)
                }
                
                # 添加缺失的字段
                for column_name, column_def in required_columns.items():
                    if column_name not in existing_columns:
                        try:
                            cursor.execute(f'ALTER TABLE videos ADD COLUMN {column_name} {column_def}')
                            print(f"已添加字段: {column_name}")
                        except sqlite3.OperationalError as e:
                            print(f"添加字段 {column_name} 失败: {e}")
            
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
            (bvid, aid, cid, title, pic, view_count, online_count, max_online_count, max_online_time, tid_v2, copyright, crawl_date, crawl_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            video.get('tid_v2'),        # 分区tid_v2
            video.get('copyright'),     # 视频类型
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
    
    def video_exists(self, bvid: str) -> bool:
        """检查视频是否已存在于数据库中"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT 1 FROM videos WHERE bvid = ? LIMIT 1', (bvid,))
            return cursor.fetchone() is not None
    
    def video_has_tid_v2(self, bvid: str) -> bool:
        """检查视频是否已经有tid_v2数据"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT tid_v2 FROM videos WHERE bvid = ? LIMIT 1', (bvid,))
            result = cursor.fetchone()
            return result is not None and result[0] is not None
    
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
                          order: str = "desc",
                          main_zone: Optional[str] = None,
                          sub_zone: Optional[str] = None) -> List[Dict]:
        """根据日期获取视频列表，支持分区筛选"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 动态获取表的字段信息，确保字段顺序正确
            cursor.execute("PRAGMA table_info(videos)")
            columns_info = cursor.fetchall()
            columns = [col[1] for col in columns_info]  # 获取字段名列表
            
            # 构建查询语句和参数
            params = []
            where_clauses = []
            
            # 日期筛选
            if date:
                where_clauses.append("crawl_date = ?")
                params.append(date)
            else:
                # 获取最新日期的数据
                where_clauses.append("crawl_date = (SELECT MAX(crawl_date) FROM videos)")
            
            # 分区筛选
            if sub_zone:
                # 如果指定了子分区，直接筛选子分区
                where_clauses.append("tid_v2 = ?")
                params.append(int(sub_zone))
            elif main_zone:
                # 如果只指定了主分区，需要获取该主分区下的所有子分区ID
                sub_zone_ids = self._get_sub_zone_ids(main_zone)
                if sub_zone_ids:
                    placeholders = ','.join(['?'] * len(sub_zone_ids))
                    where_clauses.append(f"tid_v2 IN ({placeholders})")
                    params.extend(sub_zone_ids)
                else:
                    # 如果主分区没有子分区，直接筛选主分区ID
                    where_clauses.append("tid_v2 = ?")
                    params.append(int(main_zone))
            
            # 构建完整的查询语句
            base_query = "SELECT * FROM videos"
            if where_clauses:
                query = f"{base_query} WHERE {' AND '.join(where_clauses)}"
            else:
                query = base_query
            
            # 添加排序
            query += self._build_order_clause(sort_by, order)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            # 转换为字典列表 - 使用动态获取的字段顺序
            return [dict(zip(columns, row)) for row in rows]
    
    def _get_sub_zone_ids(self, main_zone_id: str) -> List[int]:
        """获取指定主分区下的所有子分区ID"""
        # B站分区映射 - 这里使用硬编码的映射关系
        # 在实际应用中，可以从JSON文件或配置中读取
        zone_mapping = {
            "1005": [2037, 2038, 2039, 2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049, 2050, 2051, 2052, 2053, 2054],  # 动画
            "1008": [2064, 2065, 2066, 2067, 2068, 2069, 2070, 2071, 2072, 2073, 2074, 2075, 2076, 2077, 2078, 2079],  # 游戏
            "1007": [2059, 2060, 2061, 2062, 2063],  # 鬼畜
            "1003": [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027],  # 音乐
            "1004": [2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036],  # 舞蹈
            "1001": [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008],  # 影视
            "1002": [2009, 2010, 2011, 2012, 2013, 2014, 2015],  # 娱乐
            "1010": [2084, 2085, 2086, 2087, 2088, 2089, 2090, 2091, 2092, 2093, 2094, 2095],  # 知识
            "1012": [2099, 2100, 2101, 2102, 2103, 2104, 2105],  # 科技数码
            "1009": [2080, 2081, 2082, 2083],  # 资讯
            "1020": [2149, 2150, 2151, 2152, 2153],  # 美食
            "1021": [2154, 2155, 2156, 2157],  # 小剧场
            "1013": [2106, 2107, 2108, 2109, 2110],  # 汽车
            "1014": [2111, 2112, 2113, 2114, 2115, 2116, 2117, 2118, 2119],  # 时尚美妆
            "1018": [2133, 2134, 2135, 2136, 2137, 2138, 2139, 2140, 2141, 2142],  # 体育运动
            "1024": [2167, 2168, 2169, 2170, 2171],  # 动物
            "1029": [2194, 2195, 2196, 2197],  # vlog
            "1006": [2055, 2056, 2057, 2058],  # 绘画
            "1011": [2096, 2097, 2098],  # 人工智能
            "1015": [2120, 2121, 2122, 2123],  # 家装房产
            "1016": [2124, 2125, 2126, 2127],  # 户外潮流
            "1017": [2128, 2129, 2130, 2131, 2132],  # 健身
            "1019": [2143, 2144, 2145, 2146, 2147, 2148],  # 手工
            "1022": [2158, 2159, 2160, 2161],  # 旅游出行
            "1023": [2162, 2163, 2164, 2165, 2166],  # 三农
            "1025": [2172, 2173, 2174, 2175, 2176, 2177, 2178],  # 亲子
            "1026": [2179, 2180, 2181, 2182, 2183, 2184],  # 健康
            "1027": [2185, 2186, 2187, 2188],  # 情感
            "1030": [2198, 2199, 2200, 2201, 2202],  # 生活兴趣
            "1031": [2203, 2204, 2205],  # 生活经验
            "1028": [2189, 2190, 2191, 2192, 2193],  # 神秘学
        }
        
        return zone_mapping.get(main_zone_id, [])
    
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
