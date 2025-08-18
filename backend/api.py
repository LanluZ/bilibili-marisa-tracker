import json
import time
from typing import List, Dict, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager


class FastBilibiliAPI:
    """
    快速的B站API客户端，使用纯HTTP请求，无需浏览器
    专门用于获取视频详细信息
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


class BilibiliSpider:
    def __init__(
            self,
            headless: bool = True,
            timeout: int = 15,
            script_timeout: int = 20,
            page_load_timeout: int = 20,
            block_images: bool = True,
    ):
        self.headless = headless
        self.timeout = int(timeout)
        self.script_timeout = int(script_timeout)
        self.page_load_timeout = int(page_load_timeout)
        self.block_images = bool(block_images)

        self._driver: Optional[webdriver.Chrome] = None
        self._home_bootstrapped = False
        self._bvid_cid_cache: Dict[str, int] = {}

        self._driver = self._build_chrome()
        self._bootstrap_home()

    def _build_chrome(self) -> webdriver.Chrome:
        options = Options()
        if self.headless:
            options.add_argument("--headless=new")
        # 更快的加载策略：DOMContentLoaded 即可继续
        options.page_load_strategy = "eager"

        # 资源、隔离与自动化痕迹削弱
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        # 屏蔽图片/媒体加载，减少带宽与渲染消耗
        if self.block_images:
            prefs = {
                "profile.managed_default_content_settings.images": 2,
                "profile.default_content_setting_values.images": 2,
                "profile.default_content_setting_values.media_stream": 2,
                "profile.default_content_setting_values.autoplay": 2,
            }
            options.add_experimental_option("prefs", prefs)
            options.add_argument("--blink-settings=imagesEnabled=false")

        # 禁用音频相关功能
        options.add_argument("--mute-audio")  # 静音所有音频
        options.add_argument("--no-audio")    # 完全禁用音频系统
        options.add_argument("--disable-audio-output")  # 禁用音频输出
        options.add_argument("--disable-background-media-suspend")  # 禁用后台媒体暂停
        options.add_argument("--autoplay-policy=no-user-gesture-required")  # 阻止自动播放
        
        # 添加媒体相关的preference设置
        media_prefs = {
            "profile.default_content_setting_values.media_stream": 2,
            "profile.default_content_setting_values.autoplay": 2,
            "profile.managed_default_content_settings.media_stream": 2,
            "profile.managed_default_content_settings.autoplay": 2,
        }
        
        # 合并现有的prefs设置
        if self.block_images:
            existing_prefs = {
                "profile.managed_default_content_settings.images": 2,
                "profile.default_content_setting_values.images": 2,
                "profile.default_content_setting_values.media_stream": 2,
                "profile.default_content_setting_values.autoplay": 2,
            }
            existing_prefs.update(media_prefs)
            options.add_experimental_option("prefs", existing_prefs)
        else:
            options.add_experimental_option("prefs", media_prefs)

        # 使用 webdriver-manager 自动管理 ChromeDriver
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
            print("ChromeDriver 初始化成功")
        except Exception as e:
            print(f"使用 webdriver-manager 失败: {e}")
            print("尝试使用系统路径中的 ChromeDriver...")
            try:
                # fallback 到默认方式
                driver = webdriver.Chrome(options=options)
                print("使用系统 ChromeDriver 成功")
            except Exception as e2:
                print(f"系统 ChromeDriver 也失败: {e2}")
                print("请确保:")
                print("1. 已安装 Chrome 浏览器")
                print("2. ChromeDriver 版本与 Chrome 版本匹配")
                print("3. ChromeDriver 在系统 PATH 中或使用 webdriver-manager")
                raise e2
            
        driver.set_page_load_timeout(self.page_load_timeout)
        driver.set_script_timeout(self.script_timeout)

        # 隐藏 webdriver 痕迹
        try:
            driver.execute_cdp_cmd(
                "Page.addScriptToEvaluateOnNewDocument",
                {
                    "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
                },
            )
        except Exception:
            pass

        return driver

    @property
    def driver(self) -> webdriver.Chrome:
        if self._driver is None:
            self._driver = self._build_chrome()
            self._home_bootstrapped = False
        return self._driver

    def _bootstrap_home(self):
        """
        进入主站一次，建立同站点上下文，后续 fetch 能携带 Cookie，规避 412
        """
        if self._home_bootstrapped:
            return
        self.driver.get("https://www.bilibili.com/")
        WebDriverWait(self.driver, self.timeout).until(
            lambda d: d.execute_script("return document.readyState") in ("interactive", "complete")
        )
        self._home_bootstrapped = True

    def _fetch_json(
            self,
            url: str,
            retries: int = 2,
            backoff: float = 0.8,
    ) -> Dict:
        self._bootstrap_home()

        fetch_script = """
            const url = arguments[0];
            const cb = arguments[1];
            fetch(url, { credentials: 'include' })
                .then(r => r.json())
                .then(data => cb(JSON.stringify({ok: true, data})))
                .catch(err => cb(JSON.stringify({ok: false, error: String(err)})));
        """

        attempt = 0
        last_err = None
        while attempt <= retries:
            try:
                res_str = self.driver.execute_async_script(fetch_script, url)
                payload = json.loads(res_str)
                if not payload.get("ok"):
                    raise RuntimeError(payload.get("error") or "Unknown fetch error")
                return payload["data"]
            except Exception as e:
                last_err = e
                if attempt >= retries:
                    break
                time.sleep(backoff * (2 ** attempt))
                attempt += 1

        raise RuntimeError(f"Fetch failed after {retries + 1} attempts: {last_err}")

    def bvid2cid(self, bvid: str) -> int:
        if not bvid:
            raise ValueError("bvid must not be empty")

        if bvid in self._bvid_cid_cache:
            return self._bvid_cid_cache[bvid]

        url = f"https://www.bilibili.com/video/{bvid}/"
        self.driver.get(url)

        # 等待页面注入，使用显式脚本条件而非完整加载
        WebDriverWait(self.driver, self.timeout).until(
            lambda d: d.execute_script(
                "return !!(window.__INITIAL_STATE__ && window.__INITIAL_STATE__.videoData && window.__INITIAL_STATE__.videoData.pages && window.__INITIAL_STATE__.videoData.pages.length)"
            )
        )

        state_str = self.driver.execute_script("return JSON.stringify(window.__INITIAL_STATE__)")
        state = json.loads(state_str)
        pages = state["videoData"]["pages"]
        cid = int(pages[0]["cid"])
        self._bvid_cid_cache[bvid] = cid
        return cid

    def get_online_total(self, bvid: str, cid: int = -1) -> str:
        if not bvid:
            raise ValueError("bvid must not be empty")

        if cid == -1:
            cid = self.bvid2cid(bvid)

        api_url = f"https://api.bilibili.com/x/player/online/total?bvid={bvid}&cid={cid}"
        data = self._fetch_json(api_url)

        if data.get("code") != 0:
            raise RuntimeError(f"API error code={data.get('code')}, message={data.get('message')}")

        payload = data.get("data") or {}
        total = payload.get("total")
        if total is None:
            raise RuntimeError(f"Unexpected response payload: {data}")
        
        # 处理各种特殊字符格式
        total_str = str(total)
        
        # 移除 + 号
        if '+' in total_str:
            total_str = total_str.replace('+', '')
        
        # 处理万字符
        if '万' in total_str:
            # 提取数字部分，如 "1.2万" -> 1.2
            number_part = total_str.split('万')[0]
            try:
                total_num = float(number_part) * 10000
            except ValueError:
                total_num = 0
        else:
            # 直接转换为数字
            try:
                total_num = int(total_str)
            except ValueError:
                total_num = 0

        return str(int(total_num))

    def get_hot_videos(self, max_videos: int = 20) -> List[Dict]:
        """
        获取热门视频列表，返回项包含 bvid/aid、cid、封面、标题与播放量 view 等字段。
        """
        if max_videos <= 0:
            return []

        # 单页条数（API 可支持更大，这里给出保守上限，兼顾响应大小）
        ps = min(max_videos, 50)

        results: List[Dict] = []
        pn = 1
        while len(results) < max_videos:
            api_url = f"https://api.bilibili.com/x/web-interface/popular?pn={pn}&ps={ps}"
            data = self._fetch_json(api_url)

            if data.get("code") != 0:
                raise RuntimeError(f"API error code={data.get('code')}, message={data.get('message')}")

            payload = data.get("data") or {}
            items = payload.get("list") or []
            if not items:
                break

            for it in items:
                if len(results) >= max_videos:
                    break

                # 播放量优先取 stat.view，缺失时回退 stat.vv
                stat = it.get("stat") or {}
                view = stat.get("view", stat.get("vv"))
                try:
                    # 有些场景可能为字符串，转为 int
                    view = int(view) if view is not None else None
                except Exception:
                    pass

                entry: Dict = {
                    "cid": it.get("cid"),
                    "pic": it.get("pic"),
                    "title": it.get("title"),
                    "view": view,  # 播放量
                }
                if it.get("bvid"):
                    entry["bvid"] = it.get("bvid")
                else:
                    entry["aid"] = it.get("aid")
                results.append(entry)

            if bool(payload.get("no_more")):
                break
            pn += 1

        return results

    def get_video_detail(self, bvid: str) -> Optional[Dict]:
        """
        获取视频详细信息，使用FastBilibiliAPI获取
        包括tid_v2、copyright等字段
        
        Args:
            bvid: 视频的BV号
            
        Returns:
            包含视频详细信息的字典，主要字段：
            - tid_v2: 分区tid (v2)
            - copyright: 视频类型 (1:原创, 2:转载)
            - owner: UP主信息
            - stat: 统计信息
            - desc: 视频简介
            等其他详细信息
        """
        # 使用FastBilibiliAPI获取视频详细信息
        with FastBilibiliAPI() as fast_api:
            return fast_api.get_video_detail(bvid)

    def close(self):
        if self._driver is not None:
            try:
                self._driver.quit()
            except Exception:
                pass
            finally:
                self._driver = None
                self._home_bootstrapped = False

    def __enter__(self):
        if self._driver is None:
            self._driver = self._build_chrome()
            self._bootstrap_home()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def __del__(self):
        # 确保意外回收时释放资源
        try:
            self.close()
        except Exception:
            pass
