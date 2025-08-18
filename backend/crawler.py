import os
import sys
import time
from datetime import datetime, date
from typing import List, Dict

# 兼容不同的执行方式
try:
    from api import BilibiliSpider  # 当在 backend 目录下运行时
except ImportError:
    from backend.api import BilibiliSpider  # 当在项目根目录运行时

try:
    from .database import db_manager
    from .utils import validate_bvid
except ImportError:
    from database import db_manager
    from utils import validate_bvid


class CrawlerService:
    """爬虫服务类 - 封装所有爬虫操作"""
    
    def __init__(self):
        self.is_crawling = False
    
    def crawl_hot_videos(self, max_videos: int = 100) -> bool:
        """
        获取热门视频列表（不更新在线人数）
        
        Args:
            max_videos: 最大视频数量
            
        Returns:
            bool: 是否成功
        """
        if self.is_crawling:
            print("爬虫正在运行中，跳过本次任务")
            return False
        
        self.is_crawling = True
        try:
            print(f"开始获取热门视频列表，时间: {datetime.now()}")
            print(f"当前工作目录: {os.getcwd()}")
            print("正在初始化爬虫...")
            sys.stdout.flush()  # 强制刷新输出
            
            with BilibiliSpider(headless=True) as spider:
                print("爬虫初始化成功，开始获取热门视频列表")
                sys.stdout.flush()
                
                # 获取热门视频列表
                videos = spider.get_hot_videos(max_videos=max_videos)
                print(f"获取到 {len(videos)} 个热门视频")
                sys.stdout.flush()
                
                # 验证和清理数据
                valid_videos = self._validate_and_clean_videos(videos)
                
                # 为新视频获取详细信息（包含tid_v2和copyright）
                for i, video in enumerate(valid_videos):
                    bvid = video.get('bvid')
                    if bvid and not db_manager.video_exists(bvid):
                        print(f"正在获取新视频 {bvid} 的详细信息... ({i+1}/{len(valid_videos)})")
                        sys.stdout.flush()
                        
                        detail = spider.get_video_detail(bvid)
                        if detail:
                            # 更新视频信息，添加详细数据
                            video.update({
                                'tid_v2': detail.get('tid_v2'),
                                'copyright': detail.get('copyright'),
                                # 保留其他可能有用的信息
                                'desc': detail.get('desc'),
                                'duration': detail.get('duration'),
                                'pubdate': detail.get('pubdate'),
                                'ctime': detail.get('ctime'),
                            })
                            print(f"成功获取视频 {bvid} 详细信息: tid_v2={detail.get('tid_v2')}, copyright={detail.get('copyright')}")
                        else:
                            print(f"获取视频 {bvid} 详细信息失败")
                        
                        # 避免请求过快
                        time.sleep(0.5)
                    elif bvid:
                        print(f"视频 {bvid} 已存在，跳过详细信息获取")
                
                # 只添加基础信息，在线人数设为0
                for video in valid_videos:
                    video['online_count'] = "0"
                
                # 保存到数据库
                today = date.today().isoformat()
                db_manager.save_videos(valid_videos, today)
                print(f"成功保存 {len(valid_videos)} 个视频基础数据到数据库")
                sys.stdout.flush()
                
                return True
                
        except Exception as e:
            print(f"获取热门视频失败: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            self.is_crawling = False
    
    def update_online_counts(self) -> bool:
        """
        更新当天所有视频的在线观看人数
        
        Returns:
            bool: 是否成功
        """
        if self.is_crawling:
            print("更新在线人数任务正在运行中，跳过本次任务")
            return False
        
        self.is_crawling = True
        try:
            print(f"开始更新当天所有视频的在线人数，时间: {datetime.now()}")
            sys.stdout.flush()
            
            # 获取当天所有视频
            today = date.today().isoformat()
            videos_to_update = db_manager.get_videos_to_update(today)
            
            if not videos_to_update:
                print("当天没有需要更新的视频")
                return True
                
            print(f"找到 {len(videos_to_update)} 个视频需要更新在线人数")
            sys.stdout.flush()
            
            with BilibiliSpider(headless=True) as spider:
                print("爬虫初始化成功，开始更新在线人数")
                sys.stdout.flush()
                
                success_count = 0
                for i, (bvid, cid) in enumerate(videos_to_update):
                    try:
                        if not validate_bvid(bvid):
                            print(f"跳过无效的bvid: {bvid}")
                            continue
                            
                        print(f"正在更新视频 {bvid} 的在线人数...")
                        sys.stdout.flush()
                        
                        online_count = spider.get_online_total(bvid, cid if cid else -1)
                        
                        # 更新数据库中的在线人数
                        db_manager.update_video_online_count(bvid, str(online_count), today)
                        
                        print(f"更新进度: {i+1}/{len(videos_to_update)} - {bvid}: {online_count}")
                        sys.stdout.flush()
                        
                        success_count += 1
                        
                        # 添加小延迟避免请求过于频繁
                        time.sleep(1)
                        
                    except Exception as e:
                        print(f"更新视频 {bvid} 在线人数失败: {e}")
                        sys.stdout.flush()
                
                print(f"完成更新 {success_count}/{len(videos_to_update)} 个视频的在线人数")
                sys.stdout.flush()
                
                return success_count > 0
                
        except Exception as e:
            print(f"更新在线人数任务失败: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            self.is_crawling = False
    
    def _validate_and_clean_videos(self, videos: List[Dict]) -> List[Dict]:
        """
        验证和清理视频数据
        
        Args:
            videos: 原始视频数据列表
            
        Returns:
            List[Dict]: 清理后的视频数据列表
        """
        valid_videos = []
        
        for video in videos:
            try:
                # 验证必要字段
                if not video.get('title'):
                    print(f"跳过无标题视频: {video}")
                    continue
                
                bvid = video.get('bvid')
                if bvid and not validate_bvid(bvid):
                    print(f"跳过无效bvid的视频: {bvid}")
                    continue
                
                # 确保数字字段为有效值
                video['view'] = self._safe_int(video.get('view'), 0)
                video['aid'] = self._safe_int(video.get('aid'), 0)
                video['cid'] = self._safe_int(video.get('cid'), 0)
                
                valid_videos.append(video)
                
            except Exception as e:
                print(f"清理视频数据时出错: {e}, 视频: {video}")
                continue
        
        return valid_videos
    
    def _safe_int(self, value, default: int = 0) -> int:
        """安全转换为整数"""
        try:
            return int(value) if value is not None else default
        except (ValueError, TypeError):
            return default
    
    def get_status(self) -> Dict:
        """获取爬虫状态"""
        return {
            "is_crawling": self.is_crawling,
            "last_update": datetime.now().isoformat()
        }


# 创建全局爬虫服务实例
crawler_service = CrawlerService()
