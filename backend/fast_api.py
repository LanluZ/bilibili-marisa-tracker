import json
import time
import requests
from typing import Dict, Optional, List
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class FastBilibiliAPI:
    """
    快速的B站API客户端，使用纯HTTP请求，无需浏览器
    """
    def __init__(self):
        self.session = requests.Session()
        
        # 设置重试策略
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # 设置请求头，模拟浏览器
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.bilibili.com/',
            'Origin': 'https://www.bilibili.com',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
        })
        
        # 设置超时
        self.timeout = 10

    def get_video_detail(self, bvid: str) -> Optional[Dict]:
        """
        快速获取视频详细信息，包括tid_v2、copyright等字段
        
        Args:
            bvid: 视频的BV号
            
        Returns:
            包含视频详细信息的字典
        """
        try:
            api_url = f'https://api.bilibili.com/x/web-interface/view?bvid={bvid}'
            
            # 直接使用requests请求API
            response = self.session.get(api_url, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("code") != 0:
                print(f"获取视频详情失败: code={data.get('code')}, message={data.get('message')}")
                return None
                
            video_data = data.get("data")
            if not video_data:
                print(f"视频数据为空: {bvid}")
                return None
                
            # 提取关键信息
            result = {
                "bvid": video_data.get("bvid"),
                "aid": video_data.get("aid"),
                "title": video_data.get("title"),
                "desc": video_data.get("desc"),
                "pic": video_data.get("pic"),
                "duration": video_data.get("duration"),
                "pubdate": video_data.get("pubdate"),
                "ctime": video_data.get("ctime"),
                "tid": video_data.get("tid"),
                "tid_v2": video_data.get("tid_v2"),  # 分区tid (v2)
                "tname": video_data.get("tname"),
                "tname_v2": video_data.get("tname_v2"),
                "copyright": video_data.get("copyright"),  # 视频类型 (1:原创, 2:转载)
                "videos": video_data.get("videos"),  # 分P数
                "owner": video_data.get("owner"),  # UP主信息
                "stat": video_data.get("stat"),   # 统计信息
                "pages": video_data.get("pages"), # 分P信息
            }
            
            return result
            
        except requests.exceptions.RequestException as e:
            print(f"网络请求异常 {bvid}: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"JSON解析异常 {bvid}: {e}")
            return None
        except Exception as e:
            print(f"获取视频详情异常 {bvid}: {e}")
            return None

    def get_hot_videos(self, max_videos: int = 20) -> List[Dict]:
        """
        获取热门视频列表
        
        Args:
            max_videos: 最大视频数量
            
        Returns:
            视频列表，包含bvid、aid、cid、title、pic、view等字段
        """
        if max_videos <= 0:
            return []

        # 单页条数
        ps = min(max_videos, 50)
        results = []
        pn = 1
        
        while len(results) < max_videos:
            try:
                api_url = f"https://api.bilibili.com/x/web-interface/popular?pn={pn}&ps={ps}"
                response = self.session.get(api_url, timeout=self.timeout)
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("code") != 0:
                    print(f"获取热门视频失败: code={data.get('code')}, message={data.get('message')}")
                    break
                
                payload = data.get("data") or {}
                items = payload.get("list") or []
                if not items:
                    break
                
                for item in items:
                    if len(results) >= max_videos:
                        break
                    
                    # 播放量优先取 stat.view，缺失时回退 stat.vv
                    stat = item.get("stat") or {}
                    view = stat.get("view", stat.get("vv"))
                    try:
                        view = int(view) if view is not None else None
                    except Exception:
                        pass
                    
                    entry = {
                        "cid": item.get("cid"),
                        "pic": item.get("pic"),
                        "title": item.get("title"),
                        "view": view,
                    }
                    
                    if item.get("bvid"):
                        entry["bvid"] = item.get("bvid")
                    else:
                        entry["aid"] = item.get("aid")
                    
                    results.append(entry)
                
                if payload.get("no_more"):
                    break
                pn += 1
                
            except requests.exceptions.RequestException as e:
                print(f"获取热门视频网络异常: {e}")
                break
            except Exception as e:
                print(f"获取热门视频异常: {e}")
                break
        
        return results

    def get_online_total(self, bvid: str, cid: int = -1) -> str:
        """
        获取视频当前在线观看人数
        
        Args:
            bvid: 视频BV号
            cid: 视频CID，-1时自动获取
            
        Returns:
            在线人数字符串
        """
        if not bvid:
            raise ValueError("bvid must not be empty")
        
        if cid == -1:
            cid = self.bvid2cid(bvid)
        
        try:
            api_url = f"https://api.bilibili.com/x/player/online/total?bvid={bvid}&cid={cid}"
            response = self.session.get(api_url, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("code") != 0:
                print(f"获取在线人数失败: code={data.get('code')}, message={data.get('message')}")
                return "0"
            
            payload = data.get("data") or {}
            total = payload.get("total")
            if total is None:
                return "0"
            
            # 处理各种特殊字符格式
            total_str = str(total)
            
            # 移除 + 号
            if '+' in total_str:
                total_str = total_str.replace('+', '')
            
            # 处理万字符
            if '万' in total_str:
                number_part = total_str.split('万')[0]
                try:
                    total_num = float(number_part) * 10000
                except ValueError:
                    total_num = 0
            else:
                try:
                    total_num = int(total_str)
                except ValueError:
                    total_num = 0
            
            return str(int(total_num))
            
        except requests.exceptions.RequestException as e:
            print(f"获取在线人数网络异常 {bvid}: {e}")
            return "0"
        except Exception as e:
            print(f"获取在线人数异常 {bvid}: {e}")
            return "0"

    def bvid2cid(self, bvid: str) -> int:
        """
        通过bvid获取视频的cid
        """
        try:
            detail = self.get_video_detail(bvid)
            if detail and detail.get("pages"):
                # 取第一个分P的cid
                return detail["pages"][0].get("cid", 0)
            return 0
        except Exception:
            return 0

    def close(self):
        """关闭会话"""
        if hasattr(self, 'session'):
            self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def __del__(self):
        try:
            self.close()
        except Exception:
            pass
